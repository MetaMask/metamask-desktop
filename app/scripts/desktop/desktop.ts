import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import log from 'loglevel';
import cfg from './config';
import { updateCheck } from './update-check';
import { NodeWebSocket, WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { NewConnectionMessage, StatusMessage } from './types/message';
import ExtensionConnection from './extension-connection';
import { onceAny, bubbleEvents } from './utils/events';
import * as RawState from './utils/raw-state';

export default class Desktop extends EventEmitter {
  private static instance: Desktop;

  private background: EventEmitter;

  private statusWindow?: BrowserWindow;

  private extensionConnection?: ExtensionConnection;

  private status: StatusMessage;

  public static async init(backgroundEvents: EventEmitter): Promise<Desktop> {
    await Desktop.newInstance(backgroundEvents).init();
    return Desktop.getInstance();
  }

  public static newInstance(backgroundEvents: EventEmitter) {
    if (Desktop.hasInstance()) {
      return Desktop.getInstance();
    }

    const newInstance = new Desktop(backgroundEvents);
    Desktop.instance = newInstance;

    return newInstance;
  }

  public static getInstance(): Desktop {
    return Desktop.instance;
  }

  public static hasInstance(): boolean {
    return Boolean(Desktop.instance);
  }

  private constructor(backgroundEvents: EventEmitter) {
    super();

    this.background = backgroundEvents;

    this.status = new Proxy(
      { isWebSocketConnected: false, connections: [] },
      {
        set: (target: any, property: string | symbol, value: any): boolean => {
          target[property] = value;
          this.updateStatusWindow();
          return true;
        },
      },
    );
  }

  public async init() {
    await app.whenReady();

    ipcMain.handle('otp', (_, data) =>
      this.extensionConnection?.getPairing().submitOTP(data),
    );

    ipcMain.handle('popup', (_event) => {
      log.debug('Show popup not implemented');
    });

    ipcMain.handle('minimize', (_event) => this.statusWindow?.minimize());

    this.statusWindow = await this.createStatusWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isPaired = (await RawState.getDesktopState()).desktopEnabled;

    log.debug('Initialised desktop app');

    updateCheck();
  }

  private async onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    const webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    await webSocketStream.init({ startHandshake: false });

    const extensionConnection = new ExtensionConnection(
      webSocketStream,
      this.background,
    );

    onceAny(
      [
        [webSocket, 'close'],
        [extensionConnection, 'disable'],
      ],
      () => {
        this.onDisconnect(webSocket, webSocketStream, extensionConnection);
      },
    );

    extensionConnection.on(
      'connection-update',
      (connections: NewConnectionMessage[]) => {
        this.status.connections = connections;
      },
    );

    extensionConnection.on('paired', () => {
      this.status.isPaired = true;
    });

    extensionConnection.getPairing().on('invalid-otp', () => {
      this.statusWindow?.webContents.send('invalid-otp', false);
    });

    bubbleEvents(extensionConnection, this, [
      'extension-state',
      'connect-remote',
      'connect-external',
    ]);

    this.extensionConnection = extensionConnection;

    this.status.isWebSocketConnected = true;
  }

  private onDisconnect(
    webSocket: NodeWebSocket,
    stream: Duplex,
    connection: ExtensionConnection,
  ) {
    log.debug('Web socket disconnected');

    connection.disconnect();
    connection.removeAllListeners();

    stream.removeAllListeners();
    stream.destroy();

    webSocket.removeAllListeners();
    webSocket.close();

    if (connection === this.extensionConnection) {
      this.extensionConnection = undefined;
    }

    this.status.isWebSocketConnected = false;
  }

  private async createWebSocketServer(): Promise<WebSocketServer> {
    return new Promise((resolve) => {
      const server = new WebSocketServer(
        { port: cfg().desktop.webSocket.port },
        () => {
          log.debug('Created web socket server');
          resolve(server);
        },
      );
    });
  }

  private updateStatusWindow() {
    if (!this.statusWindow) {
      log.error('Status window not created');
      return;
    }

    this.statusWindow.webContents.send('status', { ...this.status });
  }

  private async createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js'),
      },
      // Doesn't work because it's not currently being added to dist_desktop
      // icon: path.resolve(__dirname, '../../build-types/desktop/images/icon-512.png')
    });

    if (cfg().desktop.skipOtpPairingFlow) {
      await statusWindow.loadFile(
        path.resolve(__dirname, '../../desktop.html'),
      );
    } else {
      await statusWindow.loadFile(
        path.resolve(__dirname, '../../desktop-pairing.html'),
      );
    }

    log.debug('Created status window');

    return statusWindow;
  }
}

import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import log from 'loglevel';
import cfg from '../utils/config';
import { NodeWebSocket, WebSocketStream } from '../shared/web-socket-stream';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { NewConnectionMessage, StatusMessage } from '../types/message';
import { onceAny, bubbleEvents } from '../utils/events';
import * as RawState from '../utils/raw-state';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';

class DesktopApp extends EventEmitter {
  private statusWindow?: BrowserWindow;

  private trezorWindow?: BrowserWindow;

  private extensionConnection?: ExtensionConnection;

  private status: StatusMessage;

  constructor() {
    super();

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
    this.trezorWindow = await this.createTrezorWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isPaired = (await RawState.getDesktopState()).desktopEnabled;

    log.debug('Initialised desktop app');

    updateCheck();
  }

  public getConnection(): ExtensionConnection | undefined {
    return this.extensionConnection;
  }

  public submitMessageToTrezorWindow(channel: string, ...args: any[]) {
    if (!this.trezorWindow) {
      throw new Error('No Trezor Window');
    }

    this.trezorWindow.webContents.send(channel, ...args);
  }

  private async onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    const webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    await webSocketStream.init({ startHandshake: false });

    const extensionConnection = new ExtensionConnection(webSocketStream);

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
        path.resolve(__dirname, '../../../desktop.html'),
      );
    } else {
      await statusWindow.loadFile(
        path.resolve(__dirname, '../../../desktop-pairing.html'),
      );
    }

    log.debug('Created status window');

    return statusWindow;
  }

  private async createTrezorWindow() {
    const trezorWindow = new BrowserWindow({
      show: false,
      parent: this.statusWindow,
      webPreferences: {
        preload: path.resolve(
          __dirname,
          './hw/trezor/renderer/trezor-preload.js',
        ),
      },
    });

    await trezorWindow.loadFile(
      path.resolve(__dirname, '../../../desktop-trezor.html'),
    );

    trezorWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://connect.trezor.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created trezor window');

    return trezorWindow;
  }
}

export default new DesktopApp();

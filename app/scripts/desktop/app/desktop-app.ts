import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import log from 'loglevel';
import cfg from '../utils/config';
import { NodeWebSocket, WebSocketStream } from '../shared/web-socket-stream';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { NewConnectionMessage, StatusMessage } from '../types/message';
import { DisconnectEventOpts } from '../types/desktop';
import { forwardEvents } from '../utils/events';
import * as RawState from '../utils/raw-state';
import { MILLISECOND } from '../../../../shared/constants/time';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';

const MAIN_WINDOW_SHOW_DELAY = 750 * MILLISECOND;

class DesktopApp extends EventEmitter {
  private mainWindow?: BrowserWindow;

  private trezorWindow?: BrowserWindow;

  private extensionConnection?: ExtensionConnection;

  private status: StatusMessage;

  constructor() {
    super();

    this.status = new Proxy(
      { isWebSocketConnected: false, connections: [] },
      {
        set: <T extends keyof StatusMessage>(
          target: StatusMessage,
          property: T,
          value: StatusMessage[T],
        ): boolean => {
          target[property] = value;
          this.updateMainWindow();
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

    ipcMain.handle('minimize', (_event) => this.mainWindow?.minimize());

    ipcMain.handle('unpair', async (_event) => {
      await this.extensionConnection?.disable();
    });

    ipcMain.handle('reset', async (_event) => {
      await RawState.clear();
      this.status.isDesktopEnabled = false;
    });

    this.mainWindow = await this.createMainWindow();
    this.trezorWindow = await this.createTrezorWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isDesktopEnabled =
      (await RawState.getDesktopState()).desktopEnabled === true;

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

    webSocket.on('close', () =>
      this.onDisconnect(webSocket, webSocketStream, extensionConnection, {
        isDisconnectedByUser: false,
      }),
    );
    extensionConnection.on('disable', () =>
      this.onDisconnect(webSocket, webSocketStream, extensionConnection, {
        isDisconnectedByUser: true,
      }),
    );

    extensionConnection.on(
      'connection-update',
      (connections: NewConnectionMessage[]) => {
        this.status.connections = connections;
      },
    );

    extensionConnection.on('paired', () => {
      this.status.isDesktopEnabled = true;
    });

    extensionConnection.getPairing().on('invalid-otp', () => {
      this.mainWindow?.webContents.send('invalid-otp', false);
    });

    forwardEvents(extensionConnection, this, [
      'restart',
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
    { isDisconnectedByUser }: DisconnectEventOpts,
  ) {
    log.debug('Extension connection disconnected');

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
    this.status.connections = [];
    if (isDisconnectedByUser) {
      this.status.isDesktopEnabled = false;
    }

    this.emit('restart');
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

  private updateMainWindow() {
    if (!this.mainWindow) {
      log.error('Status window not created');
      return;
    }

    this.mainWindow.webContents.send('status', { ...this.status });
  }

  private async createMainWindow() {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 640,
      vibrancy: 'dark',
      titleBarStyle: 'hidden',
      visualEffectState: 'active',
      show: false,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js'),
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.resolve(
        __dirname,
        '../../../../../dist_desktop_ui/images/icon-128.png',
      ),
    });

    mainWindow.loadFile(
      path.resolve(__dirname, '../../../../../dist_desktop_ui/desktop-ui.html'),
      // Temporary open pair page, it will redirect to settings page if isDesktopEnabled is true
      { hash: 'pair' },
    );

    setTimeout(() => {
      mainWindow.show();
    }, MAIN_WINDOW_SHOW_DELAY);

    log.debug('Created status window');

    if (process.env.DESKTOP_UI_DEBUG) {
      await mainWindow.webContents.openDevTools();
    }

    return mainWindow;
  }

  private async createTrezorWindow() {
    const trezorWindow = new BrowserWindow({
      show: false,
      parent: this.mainWindow,
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

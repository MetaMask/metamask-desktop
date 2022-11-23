import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import log from 'loglevel';
import { NewConnectionMessage } from '@metamask/desktop/dist/types';
import {
  NodeWebSocket,
  WebSocketStream,
} from '@metamask/desktop/dist/web-socket-stream';
import {
  clearRawState,
  getDesktopState,
} from '@metamask/desktop/dist/utils/state';
import EncryptedWebSocketStream from '@metamask/desktop/dist/encryption/web-socket-stream';
import { StatusMessage } from '../types/message';
import { forwardEvents } from '../utils/events';
import { MILLISECOND } from '../../submodules/extension/shared/constants/time';
import cfg from '../utils/config';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';
import { titleBarOverlayOpts } from './ui-constants';

const MAIN_WINDOW_SHOW_DELAY = 750 * MILLISECOND;

class DesktopApp extends EventEmitter {
  private mainWindow?: BrowserWindow;

  private trezorWindow?: BrowserWindow;

  private latticeWindow?: BrowserWindow;

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
    if (cfg().isTest) {
      app.disableHardwareAcceleration();
    }

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
      await clearRawState();
      this.status.isDesktopEnabled = false;
    });

    ipcMain.handle('set-theme', (event, theme) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setTitleBarOverlay?.(titleBarOverlayOpts[theme]);
    });

    if (!cfg().isTest) {
      this.mainWindow = await this.createMainWindow();
    }

    this.trezorWindow = await this.createTrezorWindow();
    this.latticeWindow = await this.createLatticeWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isDesktopEnabled =
      (await getDesktopState()).desktopEnabled === true;

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

  public submitMessageToLatticeWindow(channel: string, ...args: any[]) {
    if (!this.latticeWindow) {
      throw new Error('No Lattice Window');
    }

    this.latticeWindow.webContents.send(channel, ...args);
  }

  private async onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    const webSocketStream = cfg().webSocket.disableEncryption
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
    { isDisconnectedByUser }: { isDisconnectedByUser: boolean },
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
      const server = new WebSocketServer({ port: cfg().webSocket.port }, () => {
        log.debug('Created web socket server');
        resolve(server);
      });
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
      titleBarStyle: 'hidden',
      titleBarOverlay: titleBarOverlayOpts.light,
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

    if (process.platform === 'win32') {
      // Keep this to prevent "alt" key is not triggering menu in Windows
      mainWindow?.setMenu(null);
    }

    mainWindow.loadFile(
      path.resolve(
        __dirname,
        '../../submodules/extension/dist_desktop_ui/desktop-ui.html',
      ),
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
          '../hw/trezor/renderer/trezor-preload.js',
        ),
      },
    });

    await trezorWindow.loadFile(
      path.resolve(__dirname, '../../html/desktop-trezor.html'),
    );

    trezorWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://connect.trezor.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created trezor window');

    return trezorWindow;
  }

  private async createLatticeWindow() {
    const latticeWindow = new BrowserWindow({
      show: false,
      parent: this.mainWindow,
      webPreferences: {
        preload: path.resolve(
          __dirname,
          '../hw/lattice/renderer/lattice-preload.js',
        ),
      },
    });

    await latticeWindow.loadFile(
      path.resolve(__dirname, '../../html/desktop-lattice.html'),
    );

    latticeWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://lattice.gridplus.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created lattice window');

    return latticeWindow;
  }
}

export default new DesktopApp();

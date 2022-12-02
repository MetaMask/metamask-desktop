import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  shell,
  globalShortcut,
} from 'electron';
// eslint-disable-next-line @typescript-eslint/no-shadow
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
import {
  titleBarOverlayOpts,
  metamaskDesktopAboutWebsite,
  protocolKey,
} from './ui-constants';

const MAIN_WINDOW_SHOW_DELAY = 750 * MILLISECOND;

// Set protocol for deeplinking
if (!cfg().isUnitTest) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app?.setAsDefaultProtocolClient(protocolKey, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app?.setAsDefaultProtocolClient(protocolKey);
  }
}

class DesktopApp extends EventEmitter {
  private mainWindow?: BrowserWindow;

  private trezorWindow?: BrowserWindow;

  private latticeWindow?: BrowserWindow;

  private extensionConnection?: ExtensionConnection;

  private status: StatusMessage;

  private forceQuit: boolean;

  constructor() {
    super();
    this.forceQuit = false;
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
    if (cfg().isExtensionTest || cfg().isAppTest) {
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
      this.emit('restart');
      this.status.isDesktopEnabled = false;
    });

    ipcMain.handle('set-theme', (event, theme) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setTitleBarOverlay?.(titleBarOverlayOpts[theme]);
    });

    if (!cfg().isExtensionTest) {
      this.mainWindow = await this.createMainWindow();
    }
    this.trezorWindow = await this.createTrezorWindow();
    this.latticeWindow = await this.createLatticeWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isDesktopEnabled =
      (await getDesktopState()).desktopEnabled === true;

    if (!cfg().isUnitTest) {
      const gotTheLock = app.requestSingleInstanceLock();
      if (gotTheLock) {
        // We wanted to show and focus if the second instance is opened
        app.on('second-instance', () => {
          this.showAndFocusMainWindow();
        });

        // On macOS: when the dock icon is clicked and there are no other windows open
        app.on('activate', () => {
          this.showAndFocusMainWindow();
        });

        // Handle the protocol. In this case, we choose to show an Error Box.
        app.on('open-url', (_, url) => {
          if (this.mainWindow) {
            this.showAndFocusMainWindow();
            this.mainWindow.webContents.send('url-request', url);
          }
        });

        // 'before-quit' is emitted when Electron receives the signal to exit and wants to start closing windows.
        // This is for "dock right click -> quit" to work
        app.on('before-quit', () => {
          this.forceQuit = true;
        });

        // Handle CMD + Q for MacOS
        if (process.platform === 'darwin') {
          globalShortcut.register('Command+Q', () => {
            this.forceQuit = true;
            app.quit();
          });
        }
      } else {
        // This is the second instance, we should quit
        app.quit();
      }

      // Do not close the app when the window is closed
      this.mainWindow?.on('close', (event) => {
        if (!process.env.DESKTOP_UI_FORCE_CLOSE) {
          // Check if close emitted from menu
          if (this.forceQuit) {
            app.exit(0);
          } else {
            event.preventDefault();
            this.mainWindow?.hide();
          }
        }
      });

      // Create top-left menu for MacOS
      this.createMenu();

      // Create MacOS dock menu
      this.createDockMenu();

      // Create Tray icon
      this.createTray();
    }

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
      icon: path.resolve(__dirname, '../../dist/app/icon.png'),
    });

    if (process.platform === 'win32') {
      // Keep this to prevent "alt" key is not triggering menu in Windows
      mainWindow?.setMenu(null);
    }

    mainWindow.loadFile(
      path.resolve(__dirname, '../../../ui/desktop-ui.html'),
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

  private showAndFocusMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private createShowMenuItem() {
    return {
      label: 'Show',
      click: () => {
        this.showAndFocusMainWindow();
      },
    };
  }

  private createAboutMenuItem() {
    return {
      label: 'About MetaMask Desktop',
      click: async () => {
        await shell.openExternal(metamaskDesktopAboutWebsite);
      },
    };
  }

  private createQuitMenuItem() {
    return {
      label: 'Quit',
      click: () => {
        this.forceQuit = true;
        app.quit();
      },
    };
  }

  private createMenu() {
    const menuTemplate = [
      {
        label: app.name,
        submenu: [this.createAboutMenuItem(), this.createQuitMenuItem()],
      },
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  private createDockMenu() {
    if (process.platform === 'darwin') {
      const dockMenuTemplate = [this.createAboutMenuItem()];
      const dockMenu = Menu.buildFromTemplate(dockMenuTemplate);
      app.dock.setMenu(dockMenu);
    }
  }

  private createTray() {
    const tray = new Tray(
      path.resolve(__dirname, '../../../ui/icons/icon.png'),
    );
    const trayMenuTemplate = [
      this.createShowMenuItem(),
      this.createQuitMenuItem(),
    ];
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setToolTip('MetaMask Desktop');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      this.showAndFocusMainWindow();
    });
  }
}

export default new DesktopApp();

import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
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
import { uuid } from '@metamask/desktop/dist/utils/utils';
import { StatusMessage } from '../types/message';
import { forwardEvents } from '../utils/events';
import { determineLoginItemSettings } from '../utils/settings';
import cfg from '../utils/config';
import { getDesktopVersion } from '../utils/version';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';
import {
  titleBarOverlayOpts,
  protocolKey,
  uiAppStorage,
  uiPairStatusStorage,
} from './ui-constants';
import AppNavigation from './app-navigation';
import AppEvents from './app-events';
import WindowService from './window-service';
import UIState from './ui-state';
import { setUiStorage } from './ui-storage';
import MetricsService from './metrics/metrics-service';
import { EVENT_NAMES } from './metrics/metrics-constants';

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
  private extensionConnection?: ExtensionConnection;

  private additionalExtensionConnection?: ExtensionConnection;

  private status: StatusMessage;

  private appNavigation: AppNavigation;

  private appEvents: AppEvents;

  private windowService: WindowService;

  private UIState: typeof UIState;

  private metricsService: typeof MetricsService;

  constructor() {
    super();
    this.metricsService = MetricsService;
    this.UIState = UIState;
    this.appNavigation = new AppNavigation();
    this.appEvents = new AppEvents();
    this.windowService = new WindowService();
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

    ipcMain.handle('minimize', () => this.UIState.mainWindow?.minimize());

    ipcMain.handle('unpair', async () => {
      await this.extensionConnection?.disable();
    });

    ipcMain.handle('reset', async () => {
      await clearRawState();
      this.emit('restart');
      this.status.isDesktopPaired = false;
    });

    ipcMain.handle('set-theme', (event, theme) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setTitleBarOverlay?.(titleBarOverlayOpts[theme]);
    });

    ipcMain.handle('open-external', (_event, link) => {
      shell.openExternal(link);
    });

    if (!cfg().ui.preventOpenOnStartup) {
      ipcMain.handle('set-preferred-startup', (_event, preferredStartup) => {
        app.setLoginItemSettings(determineLoginItemSettings(preferredStartup));
      });
    }

    ipcMain.handle('get-desktop-version', () => {
      return getDesktopVersion();
    });

    setUiStorage(uiAppStorage);
    setUiStorage(uiPairStatusStorage);

    if (!cfg().isExtensionTest) {
      await this.windowService.createMainWindow();
    }
    await this.windowService.createTrezorWindow();
    await this.windowService.createLatticeWindow();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    this.status.isDesktopPaired =
      (await getDesktopState()).desktopEnabled === true;

    this.appEvents.register();
    this.appNavigation.create();

    log.debug('Initialised desktop app');

    updateCheck();
  }

  public getConnection(): ExtensionConnection | undefined {
    return this.extensionConnection;
  }

  public submitMessageToTrezorWindow(channel: string, ...args: any[]) {
    if (!this.UIState.trezorWindow) {
      throw new Error('No Trezor Window');
    }

    this.UIState.trezorWindow.webContents.send(channel, ...args);
  }

  public submitMessageToLatticeWindow(channel: string, ...args: any[]) {
    if (!this.UIState.latticeWindow) {
      throw new Error('No Lattice Window');
    }

    this.UIState.latticeWindow.webContents.send(channel, ...args);
  }

  private updateMainWindow() {
    if (!this.UIState.mainWindow) {
      if (!cfg().isUnitTest) {
        log.error('Main window not created');
      }
      return;
    }

    this.UIState.mainWindow.webContents.send('status', { ...this.status });
  }

  private async onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    const webSocketStream = cfg().webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    try {
      await webSocketStream.init({ startHandshake: false });
    } catch (error) {
      log.error('Failed to initialise web socket stream', error);
      webSocket.close();
      return;
    }

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
      this.status.isDesktopPaired = true;
      this.appNavigation.setPairedTrayIcon();
      // send metrics to Segment
      this.metricsService.track(EVENT_NAMES.DESKTOP_APP_PAIRED, {
        paired: true,
        createdAt: new Date(),
      });
    });

    extensionConnection.getPairing().on('invalid-otp', () => {
      this.UIState.mainWindow?.webContents.send('invalid-otp', false);
    });

    forwardEvents(extensionConnection, this, [
      'restart',
      'connect-remote',
      'connect-external',
    ]);

    if (this.status.isDesktopPaired) {
      this.appNavigation.setPairedTrayIcon();
    }

    // if a connection is active it should set new connection as on hold
    // so the user unpair properly before establishing a new connection
    if (this.extensionConnection && this.status.isDesktopPaired) {
      if (this.additionalExtensionConnection) {
        this.additionalExtensionConnection.disconnect();
        this.additionalExtensionConnection.removeAllListeners();
        this.additionalExtensionConnection = undefined;
      }

      this.additionalExtensionConnection = extensionConnection;
      return;
    }
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
      this.status.isWebSocketConnected = false;
    } else if (connection === this.additionalExtensionConnection) {
      this.additionalExtensionConnection = undefined;
    }

    this.status.connections = [];
    if (isDisconnectedByUser) {
      this.status.isDesktopPaired = false;
    }

    this.appNavigation.setUnPairedTrayIcon();

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
}

export default new DesktopApp();

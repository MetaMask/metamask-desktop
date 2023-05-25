import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { readdir, unlink } from 'fs/promises';
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
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
import { StatusMessage } from './types/message';
import { forwardEvents } from './utils/events';
import { determineLoginItemSettings } from './utils/settings';
import cfg from './utils/config';
import { getDesktopVersion } from './utils/version';
import {
  registerTabsHandler,
  registerWindowHandler,
  unregisterTabsHandler,
  unregisterWindowHandler,
} from './browser/node-browser';
import { WindowCreateRequest, WindowUpdateRequest } from './types/window';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';
import {
  titleBarOverlayOpts,
  protocolKey,
  uiAppStorage,
  uiPairStatusStorage,
} from './ui/ui-constants';
import AppNavigation from './ui/app-navigation';
import AppEvents from './ui/app-events';
import WindowService from './ui/window-service';
import UIState from './ui/ui-state';
import { setLanguage, t } from './utils/translation';
import {
  readPersistedSettingFromAppState,
  setUiStorage,
} from './storage/ui-storage';
import MetricsService from './metrics/metrics-service';
import { EVENT_NAMES } from './metrics/metrics-constants';
import { encryptedCypherFilePath } from './storage/storage';
import { IPCRendererStream } from './ipc-renderer-stream';
import { TabsQuery } from './types/tabs';
import sleep from './utils/sleep';

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
  public approvalStream?: IPCRendererStream;

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

    ipcMain.handle('ui-dialog', (_event, params) => {
      return dialog.showMessageBox(params);
    });

    ipcMain.handle('toggle-desktop-popup', async (_event, isEnabled) => {
      if (cfg().enableDesktopPopup && isEnabled) {
        // quick hack to avoid race condition between emit the restart and having the UI persisting the isDesktopPopupEnabled
        await sleep(500);
        this.enableDesktopPopup(false);
      } else {
        this.disableDesktopPopup();
      }
    });

    ipcMain.handle('unpair', async () => {
      if (cfg().isExtensionTest || cfg().isAppTest) {
        await this.extensionConnection?.disable();
        return;
      }

      dialog
        .showMessageBox({
          type: 'info',
          title: t('unpairMetaMaskDesktop'),
          message: t('unpairMetaMaskDesktopDesc'),
          buttons: [t('yes'), t('no')],
        })
        .then(async (value) => {
          if (value.response === 0) {
            await this.extensionConnection?.disable();
          }
        });
    });

    ipcMain.handle('reset', async () => {
      await clearRawState();
      this.emit('restart');
      this.status.isDesktopPaired = false;
    });

    ipcMain.handle('set-theme', (event, theme) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setTitleBarOverlay?.(
        titleBarOverlayOpts[theme as keyof typeof titleBarOverlayOpts],
      );
    });

    ipcMain.handle('sync-theme', (_event, theme) => {
      this.UIState.approvalWindow?.webContents.send('theme-changed', theme);
    });

    ipcMain.handle('set-language', (_event, language) => {
      setLanguage(language);
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

    ipcMain.handle('get-desktop-metrics-decision', () => {
      return readPersistedSettingFromAppState({
        defaultValue: false,
        key: 'metametricsOptIn',
      });
    });

    ipcMain.handle('factory-reset', async () => {
      if (this.status.isDesktopPaired) {
        dialog.showMessageBox({
          type: 'info',
          title: t('unpairFirst'),
          message: t('beforeFactoryReset'),
        });
        return;
      }

      dialog
        .showMessageBox({
          type: 'info',
          title: t('factoryResetMetaMaskDesktop'),
          message: t('factoryResetDesc'),
          buttons: [t('yes'), t('no')],
        })
        .then(async (value) => {
          if (value.response === 0) {
            this.metricsService.track(EVENT_NAMES.DESKTOP_APP_FACTORY_RESET);
            // Regex to match all json files/stores in the userData folder
            const regex = new RegExp(/.json$/u, 'u');
            const storesPath = app.getPath('userData');
            const files = await readdir(storesPath);
            files
              .filter((file) => regex.test(file))
              .map((file) => unlink(path.resolve(storesPath, file)));

            // Delete the encrypted cypher file
            await unlink(encryptedCypherFilePath());

            app.relaunch();
            app.exit();
          }
        });
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

    // Tracks an event whenever desktop app is set to open at startup
    if (app.getLoginItemSettings()?.openAtLogin) {
      this.metricsService.track(EVENT_NAMES.DESKTOP_APP_OPENED_STARTUP, {
        openAtLogin: true,
        startedAt: new Date(),
      });
    }

    const isDesktopPopupEnabled = this.isDesktopPopupEnabled();
    if (cfg().enableDesktopPopup && isDesktopPopupEnabled) {
      this.enableDesktopPopup(true);
    }

    log.debug('Initialised desktop app');

    updateCheck();

    return { isDesktopPopupEnabled };
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

  public hideApprovalWindow() {
    this.UIState.approvalWindow?.hide();
  }

  public isDesktopPopupEnabled(): boolean {
    const isDesktopPopupEnabled = readPersistedSettingFromAppState({
      key: 'isDesktopPopupEnabled',
      defaultValue: false,
    });
    return isDesktopPopupEnabled;
  }

  private async enableDesktopPopup(isInitial = false) {
    await this.windowService.createApprovalWindow();
    registerWindowHandler({
      create: (request: WindowCreateRequest) => this.onWindowCreate(request),
      remove: (windowId: string) => this.onWindowRemove(windowId),
      update: (request: WindowUpdateRequest) => this.onWindowUpdate(request),
    });

    registerTabsHandler({ query: (_request: TabsQuery) => [] });

    this.approvalStream = new IPCRendererStream(
      this.UIState.approvalWindow as any,
      'approval-ui',
    );

    if (!isInitial) {
      // We need to trigger a restart to ensure registerConnectListeners is called
      // with the new approvalStream
      this.emit('restart');
    }
  }

  private disableDesktopPopup() {
    this.approvalStream?.removeAllListeners();
    this.approvalStream?.destroy();
    this.approvalStream = undefined;

    this.UIState.approvalWindow?.destroy();
    this.UIState.approvalWindow = undefined;

    unregisterWindowHandler();
    unregisterTabsHandler();
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
    });

    extensionConnection.getPairing().on('invalid-otp', () => {
      this.UIState.mainWindow?.webContents.send('invalid-otp', false);
      this.metricsService.track(EVENT_NAMES.INVALID_OTP, {});
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

  private onWindowCreate(
    request: WindowCreateRequest,
  ): BrowserWindow | undefined {
    const { approvalWindow } = this.UIState;

    if (!approvalWindow) {
      return undefined;
    }

    approvalWindow.setSize(request.width, request.height);
    approvalWindow.setPosition(request.left, request.top);
    approvalWindow.setTitle('MetaMask Desktop Notification');
    approvalWindow.webContents.send('show');
    approvalWindow.show();

    return approvalWindow;
  }

  private onWindowRemove(_windowId: string) {
    this.UIState?.approvalWindow?.hide();
  }

  private onWindowUpdate(_request: WindowUpdateRequest) {
    // Not required yet as only used in FireFox to position window
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

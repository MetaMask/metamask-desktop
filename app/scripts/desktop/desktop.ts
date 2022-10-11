import { Duplex, EventEmitter } from 'stream';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer, WebSocket } from 'ws';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
  CLIENT_ID_PAIRING,
} from '../../../shared/constants/desktop';
import cfg from './config';
import { updateCheck } from './update-check';
import { WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './browser/browser-polyfill';
import {
  ConnectionType,
  ConnectRemoteFactory,
  State,
} from './types/background';
import {
  BrowserControllerAction,
  EndConnectionMessage,
  NewConnectionMessage,
  PairingMessage,
  StatusMessage,
} from './types/message';
import { ClientId } from './types/desktop';
import { registerRequestStream } from './browser/node-browser';

export default class Desktop {
  private static instance: Desktop;

  private backgroundInitialise: () => Promise<void>;

  private connections: NewConnectionMessage[];

  private multiplex: ObjectMultiplex;

  private clientStreams: { [clientId: ClientId]: Duplex };

  private connectRemote?: ConnectRemoteFactory;

  private connectExternal?: ConnectRemoteFactory;

  private webSocket?: WebSocket;

  private webSocketStream?: WebSocketStream | EncryptedWebSocketStream;

  private browserControllerStream?: Duplex;

  private disableStream?: Duplex;

  private stateStream?: Duplex;

  private pairingStream?: Duplex;

  private statusWindow?: BrowserWindow;

  private trezorWindow?: BrowserWindow;

  private hasBeenInitializedWithExtensionState?: boolean;

  private isPaired?: boolean;

  public static async init(backgroundInitialise: () => Promise<void>) {
    Desktop.instance = new Desktop(backgroundInitialise);
    await Desktop.instance.init();
  }

  public static newInstance(backgroundInitialise: () => Promise<void>) {
    if (Desktop.hasInstance()) {
      return Desktop.getInstance();
    }

    const newInstance = new Desktop(backgroundInitialise);
    Desktop.instance = newInstance;

    return newInstance;
  }

  public static getInstance(): Desktop {
    return Desktop.instance;
  }

  public static hasInstance(): boolean {
    return Boolean(Desktop.instance);
  }

  private constructor(backgroundInitialise: () => Promise<void>) {
    this.backgroundInitialise = backgroundInitialise;
    this.connections = [];
    this.multiplex = new ObjectMultiplex();
    this.clientStreams = {};
  }

  public async init() {
    await app.whenReady();

    const server = await this.createWebSocketServer();
    server.on('connection', (webSocket) => this.onConnection(webSocket));

    await this.initStreams();

    ipcMain.handle('otp', (_event, data) => this.onOTPSubmit(data));
    ipcMain.handle('popup', (_event) => this.showPopup());
    ipcMain.handle('minimize', (_event) => this.statusWindow?.minimize());

    this.statusWindow = await this.createStatusWindow();
    this.trezorWindow = await this.createTrezorWindow();

    const state = await browser.storage.local.get();
    this.isPaired = state.data.PreferencesController.desktopEnabled;
    this.updateStatusWindow();

    log.debug('Initialised desktop');

    updateCheck();
  }

  public registerCallbacks(
    connectRemote: ConnectRemoteFactory,
    connectExternal: ConnectRemoteFactory,
    metaMaskController: EventEmitter,
  ) {
    this.connectRemote = connectRemote;
    this.connectExternal = connectExternal;

    metaMaskController.on('update', (state) => this.onStateUpdate(state));
  }

  public showPopup() {
    if (!this.browserControllerStream) {
      log.debug('Browser controller stream not initialised');
      return;
    }

    this.browserControllerStream.write(
      BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP,
    );
  }

  private onExtensionOtpPairing(pairingMessage: PairingMessage) {
    if (!pairingMessage?.isPaired) {
      this.statusWindow?.webContents.send('invalid-otp', false);
    }
  }

  public transferState(rawState: State) {
    if (!this.canTransferState()) {
      log.debug(
        'Cannot transfer state to extension as waiting for initial state from extension',
      );
      return;
    }

    this.stateStream?.write(rawState);

    log.debug('Sent state to extension');
  }

  public submitMessageToTrezorWindow(channel: string, ...args: any[]) {
    if (!this.trezorWindow) {
      throw new Error('No Trezor Window');
    }

    this.trezorWindow.webContents.send(channel, ...args);
  }

  private async disable() {
    log.debug('Desktop disabled');

    if (!this.disableStream) {
      log.error('Disable stream not initialised');
      return;
    }

    if (!this.canTransferState()) {
      log.debug(
        'Cannot transfer state to extension as waiting for initial state from extension',
      );
      return;
    }

    this.hasBeenInitializedWithExtensionState = false;

    const state = await browser.storage.local.get();
    state.data.PreferencesController.desktopEnabled = false;
    state.data.PreferencesController.isPairing = false;

    this.disableStream.write(state);

    log.debug(
      'Sent state to extension and reset extension state initialization flag',
    );
  }

  private canTransferState() {
    return this.webSocketStream && this.hasBeenInitializedWithExtensionState;
  }

  private async createStatusWindow() {
    const statusWindow = new BrowserWindow({
      width: 800,
      height: 400,
      webPreferences: {
        preload: path.resolve(__dirname, './status-preload.js'),
      },
      // Doesn not work because it's not currently being added to dist_desktop
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

  private async createTrezorWindow() {
    const trezorWindow = new BrowserWindow({
      show: false,
      parent: this.statusWindow,
      webPreferences: {
        preload: path.resolve(__dirname, './trezor/trezor-preload.js'),
      },
    });

    await trezorWindow.loadFile(path.resolve(__dirname, '../../trezor.html'));

    trezorWindow.webContents.setWindowOpenHandler((details) => ({
      action: details.url.startsWith('https://connect.trezor.io/')
        ? 'allow'
        : 'deny',
    }));

    log.debug('Created trezor window');

    return trezorWindow;
  }

  private async onConnection(webSocket: WebSocket) {
    log.debug('Received web socket connection');

    this.webSocket = webSocket;
    this.webSocket.on('close', () => this.onDisconnect());

    this.webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(this.webSocket)
      : new EncryptedWebSocketStream(this.webSocket);

    await this.webSocketStream.init({ startHandshake: false });
    this.webSocketStream.pipe(this.multiplex).pipe(this.webSocketStream);

    this.updateStatusWindow();
  }

  private onDisconnect() {
    log.debug('Web socket disconnected');

    this.webSocket = undefined;

    if (this.webSocketStream) {
      this.webSocketStream.end();
      this.webSocketStream = undefined;
    } else {
      log.error('Web socket stream not initialised');
    }

    Object.values(this.clientStreams).forEach((clientStream) =>
      clientStream.end(),
    );

    this.updateStatusWindow();
  }

  private onNewConnectionMessage(data: NewConnectionMessage) {
    log.debug('Received new connection message', {
      clientId: data.clientId,
      name: data.remotePort.name,
      url: data.remotePort.sender.url,
      connectionType: data.connectionType,
    });

    if (!this.connectRemote || !this.connectExternal) {
      log.error('Connect callbacks not set');
      return;
    }

    const { clientId, connectionType } = data;

    const stream = this.multiplex.createStream(clientId);
    this.clientStreams[clientId] = stream;

    endOfStream(stream, () => this.onClientStreamEnd(clientId));

    const connectArgs = {
      ...data.remotePort,
      stream,
      onMessage: {
        addListener: () => undefined,
      },
    };

    switch (connectionType) {
      case ConnectionType.INTERNAL:
        this.connectRemote(connectArgs);
        break;

      case ConnectionType.EXTERNAL:
        this.connectExternal(connectArgs);
        break;

      default:
        throw new Error(`Connection type not supported - ${connectionType}`);
    }

    this.connections.push(data);
    this.updateStatusWindow();
  }

  private async onExtensionState(data: any) {
    log.debug('Received extension state');

    await browser.storage.local.set(data);

    this.hasBeenInitializedWithExtensionState = true;

    log.debug('Synchronised with extension state');

    log.debug('Re-initialising background script');
    await this.backgroundInitialise();

    log.debug('Sending to extension pairing is complete');
    this.isPaired = true;
    this.pairingStream?.write({ isPaired: this.isPaired });
    this.updateStatusWindow();
  }

  private onClientStreamEnd(clientId: ClientId) {
    log.debug('Client stream ended', clientId);

    const index = this.connections.findIndex(
      (connection) => connection.clientId === clientId,
    );

    this.connections.splice(index, 1);

    delete this.clientStreams[clientId];
    delete this.multiplex._substreams[clientId];

    this.updateStatusWindow();
  }

  private onEndConnectionMessage(data: EndConnectionMessage) {
    log.debug('Received end connection message', data);
    this.clientStreams[data.clientId]?.end();
  }

  private async onStateUpdate(state: any) {
    if (state.isPairing === false && state.desktopEnabled === false) {
      await this.disable();
    }
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

    const statusMessage: StatusMessage = {
      isWebSocketConnected: Boolean(this.webSocket),
      connections: this.connections,
      isPaired: this.isPaired,
    };

    this.statusWindow.webContents.send('status', statusMessage);
  }

  private async onOTPSubmit(otp: string) {
    log.debug('Submitted OTP', otp);
    if (!this.pairingStream) {
      log.error('Pairing stream not initialised');
      return;
    }
    this.pairingStream.write({ otp, isPaired: false });
  }

  private async initStreams() {
    this.pairingStream = this.multiplex.createStream(CLIENT_ID_PAIRING);
    this.pairingStream.on('data', (data: PairingMessage) =>
      this.onExtensionOtpPairing(data),
    );

    const browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );
    registerRequestStream(browserControllerStream);

    const endConnectionStream = this.multiplex.createStream(
      CLIENT_ID_END_CONNECTION,
    );
    endConnectionStream.on('data', (data: EndConnectionMessage) =>
      this.onEndConnectionMessage(data),
    );

    const newConnectionStream = this.multiplex.createStream(
      CLIENT_ID_NEW_CONNECTION,
    );
    newConnectionStream.on('data', (data: NewConnectionMessage) =>
      this.onNewConnectionMessage(data),
    );

    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    this.stateStream.on('data', (data: any) => this.onExtensionState(data));

    this.disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);
  }
}

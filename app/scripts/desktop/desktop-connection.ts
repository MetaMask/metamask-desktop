import { Duplex, EventEmitter, PassThrough } from 'stream';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import NotificationManager from '../lib/notification-manager';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import cfg from './config';
import { BrowserWebSocket, WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './extension-polyfill';
import {
  ConnectionType,
  RemotePort,
  RemotePortData,
  State,
} from './types/background';
import { ClientId } from './types/desktop';
import {
  BrowserControllerAction,
  BrowserControllerMessage,
} from './types/message';

const TIMEOUT_CONNECT = 5000;

export default class DesktopConnection {
  private static instance: DesktopConnection;

  private notificationManager: NotificationManager;

  private clientIdCounter: number;

  private multiplex: ObjectMultiplex;

  private webSocket?: BrowserWebSocket;

  private webSocketStream?: WebSocketStream | EncryptedWebSocketStream;

  private endConnectionStream?: Duplex;

  private newConnectionStream?: Duplex;

  private stateStream?: Duplex;

  public static async initIfEnabled(
    notificationManager: NotificationManager,
    state: any,
  ) {
    if (state && state.PreferencesController.desktopEnabled !== true) {
      return;
    }

    await DesktopConnection.init(notificationManager);
  }

  public static newInstance(
    notificationManager: NotificationManager,
  ): DesktopConnection {
    if (DesktopConnection.hasInstance()) {
      return DesktopConnection.getInstance();
    }

    const newInstance = new DesktopConnection(notificationManager);
    DesktopConnection.instance = newInstance;

    return newInstance;
  }

  public static getInstance(): DesktopConnection {
    return DesktopConnection.instance;
  }

  public static hasInstance(): boolean {
    return Boolean(DesktopConnection.getInstance());
  }

  public static registerCallbacks(
    metaMaskController: EventEmitter,
    notificationManager: NotificationManager,
  ) {
    metaMaskController.on('update', (state) =>
      DesktopConnection.onStateUpdate(state, notificationManager),
    );

    log.debug('Registered desktop connection callbacks');
  }

  private static async onStateUpdate(
    state: any,
    notificationManager: NotificationManager,
  ) {
    const desktopEnabled = state.desktopEnabled as boolean;

    if (!DesktopConnection.hasInstance() && desktopEnabled === true) {
      log.debug('Desktop enabled');

      await DesktopConnection.init(notificationManager);
      await DesktopConnection.getInstance().transferState();
    }
  }

  private static async init(notificationManager: NotificationManager) {
    DesktopConnection.newInstance(notificationManager);

    try {
      await DesktopConnection.instance.init();
    } catch (error) {
      log.error('Failed to initialise desktop connection');
    }
  }

  private constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
    this.clientIdCounter = 1;
    this.multiplex = new ObjectMultiplex();
  }

  public async init() {
    await this.connect();

    const browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    browserControllerStream.on('data', (data: BrowserControllerMessage) =>
      this.onBrowserControlMessage(data),
    );

    this.endConnectionStream = this.multiplex.createStream(
      CLIENT_ID_END_CONNECTION,
    );

    this.newConnectionStream = this.multiplex.createStream(
      CLIENT_ID_NEW_CONNECTION,
    );

    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);
    this.stateStream.on('data', (rawState: State) =>
      this.onDesktopState(rawState),
    );

    const disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);
    disableStream.on('data', (data: State) => this.onDisable(data));

    log.debug('Connected to desktop');
  }

  public async transferState() {
    if (!this.stateStream) {
      log.error('State stream not initialised');
      return;
    }

    const state = await browser.storage.local.get();
    state.data.PreferencesController.desktopEnabled = true;

    this.stateStream.write(state);

    log.debug('Sent extension state to desktop');
  }

  /**
   * Creates a connection with the MetaMask Desktop via a multiplexed stream.
   *
   * @param remotePort - The port provided by a new context.
   * @param connectionType - Whether or not the new context is external (page or other extension).
   */
  public async createStream(
    remotePort: RemotePort,
    connectionType: ConnectionType,
  ) {
    const uiStream = new PortStream(remotePort as any);
    uiStream.pause();
    uiStream.on('data', (data) => this.onUIMessage(data, uiStream as any));

    // Wrapping the original UI stream allows us to intercept messages required for error handling,
    // while still pausing messages from the UI until we are connected to the desktop.
    const uiInputStream = new PassThrough({ objectMode: true });
    uiInputStream.pause();

    uiStream.pipe(uiInputStream);
    uiStream.resume();

    if (!this.webSocketStream) {
      try {
        await this.connect();
      } catch (error) {
        log.error('Failed to create desktop stream as reconnect failed');
        return;
      }
    }

    const clientId = this.getNextClientId();
    const clientStream = this.multiplex.createStream(clientId);

    uiInputStream.pipe(clientStream).pipe(uiStream as any);

    endOfStream(uiStream, () => {
      uiInputStream.destroy();
      this.onPortStreamEnd(clientId, clientStream);
    });

    this.sendNewConnectionMessage(remotePort, clientId, connectionType);

    uiInputStream.resume();
  }

  private async onDisable(state: State) {
    log.debug('Received desktop disable message');

    await browser.storage.local.set(state);
    log.debug('Synchronised state with desktop');

    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private async connect() {
    this.webSocket = await this.createWebSocket();
    this.webSocket.addEventListener('close', () => this.onDisconnect());

    this.webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(this.webSocket)
      : new EncryptedWebSocketStream(this.webSocket);

    await this.webSocketStream.init({ startHandshake: true });
    this.webSocketStream.pipe(this.multiplex).pipe(this.webSocketStream);

    log.debug('Created web socket connection');
  }

  private onDisconnect() {
    log.debug('Web socket disconnected');

    this.webSocketStream?.end();
    this.webSocketStream = undefined;

    this.webSocket = undefined;
  }

  private onPortStreamEnd(clientId: ClientId, clientStream: Duplex) {
    log.debug('Port stream closed', clientId);

    clientStream.end();

    if (!this.endConnectionStream) {
      log.error('End connection stream not initialised');
      return;
    }

    this.endConnectionStream.write({ clientId });
  }

  private async onDesktopState(rawState: State) {
    await browser.storage.local.set(rawState);
    log.debug('Synchronised state with desktop');
  }

  private async onUIMessage(data: any, stream: Duplex) {
    const method = data.data?.method;
    const id = data.data?.id;

    if (method === 'disableDesktop') {
      await this.disable();
    }

    if (method === 'getDesktopEnabled') {
      stream.write({
        name: data.name,
        data: { jsonrpc: '2.0', result: true, id },
      });
    }
  }

  private sendNewConnectionMessage(
    remotePort: RemotePortData,
    clientId: ClientId,
    connectionType: ConnectionType,
  ) {
    if (!this.newConnectionStream) {
      log.error('New Connection stream not initialised');
      return;
    }

    const newConnectionMessage = {
      clientId,
      connectionType,
      remotePort: {
        name: remotePort.name,
        sender: remotePort.sender,
      },
    };

    log.debug('Sending new connection message', newConnectionMessage);

    this.newConnectionStream.write(newConnectionMessage);
  }

  private onBrowserControlMessage(data: BrowserControllerMessage) {
    switch (data) {
      case BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP:
        this.notificationManager.showPopup();
        return;
      default:
        log.debug('Unrecognised browser control message', data);
    }
  }

  private async disable() {
    log.debug('Disabling desktop app');

    const rawState = await browser.storage.local.get();
    rawState.data.PreferencesController.desktopEnabled = false;
    await browser.storage.local.set(rawState);

    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  private async createWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const webSocket = new WebSocket(`${cfg().desktop.webSocket.url}`);

      webSocket.addEventListener('open', () => {
        resolve(webSocket);
      });

      setTimeout(() => {
        const message = 'Timeout connecting to web socket server';
        log.error(message);
        reject(new Error(message));
      }, TIMEOUT_CONNECT);
    });
  }

  private getNextClientId(): ClientId {
    /* eslint-disable-next-line no-plusplus */
    return this.clientIdCounter++;
  }
}

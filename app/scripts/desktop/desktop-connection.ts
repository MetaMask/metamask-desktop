import { Duplex } from 'stream';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import NotificationManager from '../lib/notification-manager';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
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

export default class DesktopConnection {
  private notificationManager: NotificationManager;

  private clientIdCounter: number;

  private multiplex: ObjectMultiplex;

  private webSocket?: BrowserWebSocket;

  private webSocketStream?: WebSocketStream | EncryptedWebSocketStream;

  private connectionControllerStream?: Duplex;

  private handshakeStream?: Duplex;

  private stateStream?: Duplex;

  constructor(notificationManager: NotificationManager) {
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

    this.connectionControllerStream = this.multiplex.createStream(
      CLIENT_ID_CONNECTION_CONTROLLER,
    );

    this.handshakeStream = this.multiplex.createStream(CLIENT_ID_HANDSHAKES);
    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);

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
    const portStream = new PortStream(remotePort as any);
    portStream.pause();

    if (!this.webSocketStream) {
      await this.connect();
    }

    const clientId = this.getNextClientId();
    const clientStream = this.multiplex.createStream(clientId);

    portStream.pipe(clientStream).pipe(portStream as unknown as Duplex);

    endOfStream(portStream, () => this.onPortStreamEnd(clientId, clientStream));

    this.sendHandshake(remotePort, clientId, connectionType);

    portStream.resume();
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

    if (!this.connectionControllerStream) {
      log.error('Connection controller stream not initialised');
      return;
    }

    this.connectionControllerStream.write({ clientId });
  }

  private sendHandshake(
    remotePort: RemotePortData,
    clientId: ClientId,
    connectionType: ConnectionType,
  ) {
    if (!this.handshakeStream) {
      log.error('Handshake stream not initialised');
      return;
    }

    const handshake = {
      clientId,
      connectionType,
      remotePort: {
        name: remotePort.name,
        sender: remotePort.sender,
      },
    };

    log.debug('Sending handshake', handshake);

    this.handshakeStream.write(handshake);
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

  private async createWebSocket(): Promise<WebSocket> {
    return new Promise((resolve) => {
      const webSocket = new WebSocket(`${cfg().desktop.webSocket.url}`);
      webSocket.addEventListener('open', () => {
        resolve(webSocket);
      });
    });
  }

  private getNextClientId(): ClientId {
    /* eslint-disable-next-line no-plusplus */
    return this.clientIdCounter++;
  }
}

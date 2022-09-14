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
import { WebSocketStream } from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './extension-polyfill';
import { RemotePort, RemotePortData, State } from './types/background';
import { ClientId } from './types/desktop';
import {
  BrowserControllerAction,
  BrowserControllerMessage,
} from './types/message';

export default class DesktopConnection {
  private notificationManager: NotificationManager;

  private clientIdCounter: number;

  private multiplex: ObjectMultiplex;

  private webSocketStream?: WebSocketStream | EncryptedWebSocketStream;

  private connectionControllerStream?: Duplex;

  private handshakeStream?: Duplex;

  private stateStream?: Duplex;

  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
    this.clientIdCounter = 1;
    this.multiplex = new ObjectMultiplex();
  }

  init() {
    this._connect();

    const browserControllerStream = this.multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    browserControllerStream.on('data', (data: BrowserControllerMessage) =>
      this._onBrowserControlMessage(data),
    );

    this.connectionControllerStream = this.multiplex.createStream(
      CLIENT_ID_CONNECTION_CONTROLLER,
    );

    this.handshakeStream = this.multiplex.createStream(CLIENT_ID_HANDSHAKES);
    this.stateStream = this.multiplex.createStream(CLIENT_ID_STATE);

    const disableStream = this.multiplex.createStream(CLIENT_ID_DISABLE);
    disableStream.on('data', (data: State) => this._onDisable(data));

    log.debug('Connected to desktop');
  }

  async transferState() {
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
   * @param isExternal - Whether or not the new context is external (page or other extension).
   */
  createStream(remotePort: RemotePort, isExternal: boolean) {
    if (!this.webSocketStream) {
      this._connect();
    }

    const portStream = new PortStream(remotePort as any);
    const clientId = this._getNextClientId();
    const clientStream = this.multiplex.createStream(clientId);

    portStream.pipe(clientStream).pipe(portStream as unknown as Duplex);

    endOfStream(portStream, () =>
      this._onPortStreamEnd(clientId, clientStream),
    );

    this._sendHandshake(remotePort, clientId, isExternal);
  }

  async _onDisable(state: State) {
    log.debug('Received desktop disable message');

    await browser.storage.local.set(state);
    log.debug('Synchronised state with desktop');

    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  _connect() {
    const webSocket = this._createWebSocket();
    webSocket.addEventListener('close', () => this._onDisconnect());

    this.webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    this.webSocketStream.init();
    this.webSocketStream.pipe(this.multiplex).pipe(this.webSocketStream);

    log.debug('Created web socket connection');
  }

  _onDisconnect() {
    this.webSocketStream = undefined;
  }

  _onPortStreamEnd(clientId: ClientId, clientStream: Duplex) {
    log.debug('Port stream closed', clientId);

    clientStream.end();

    if (!this.connectionControllerStream) {
      log.error('Connection controller stream not initialised');
      return;
    }

    this.connectionControllerStream.write({ clientId });
  }

  _sendHandshake(
    remotePort: RemotePortData,
    clientId: ClientId,
    isExternal: boolean,
  ) {
    if (!this.handshakeStream) {
      log.error('Handshake stream not initialised');
      return;
    }

    const handshake = {
      clientId,
      remotePort: {
        name: remotePort.name,
        sender: remotePort.sender,
      },
      isExternal,
    };

    log.debug('Sending handshake', handshake);

    this.handshakeStream.write(handshake);
  }

  _onBrowserControlMessage(data: BrowserControllerMessage) {
    switch (data) {
      case BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP:
        this.notificationManager.showPopup();
        return;
      default:
        log.debug('Unrecognised browser control message', data);
    }
  }

  _createWebSocket(): WebSocket {
    // eslint-disable-next-line no-undef
    return new WebSocket(`${cfg().desktop.webSocket.url}`);
  }

  _getNextClientId(): ClientId {
    /* eslint-disable-next-line no-plusplus */
    return this.clientIdCounter++;
  }
}

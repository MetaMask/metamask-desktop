import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  BROWSER_ACTION_SHOW_POPUP,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import cfg from './config';
import WebSocketStream from './web-socket-stream';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { browser } from './extension-polyfill';

export default class DesktopConnection {
  constructor(notificationManager) {
    this._notificationManager = notificationManager;
    this._clientIdCounter = 1;
    this._multiplex = new ObjectMultiplex();
  }

  init() {
    this._connect();

    const browserControllerStream = this._multiplex.createStream(
      CLIENT_ID_BROWSER_CONTROLLER,
    );

    browserControllerStream.on('data', (data) =>
      this._onBrowserControlMessage(data),
    );

    this._connectionControllerStream = this._multiplex.createStream(
      CLIENT_ID_CONNECTION_CONTROLLER,
    );

    this._handshakeStream = this._multiplex.createStream(CLIENT_ID_HANDSHAKES);
    this._stateStream = this._multiplex.createStream(CLIENT_ID_STATE);

    const disableStream = this._multiplex.createStream(CLIENT_ID_DISABLE);
    disableStream.on('data', (data) => this._onDisable(data));

    log.debug('Connected to desktop');
  }

  async transferState() {
    const state = await browser.storage.local.get();
    state.data.PreferencesController.desktopEnabled = true;

    this._stateStream.write(state);

    log.debug('Sent extension state to desktop');
  }

  createStream(remotePort) {
    if (!this._webSocketStream) {
      this._connect();
    }

    const portStream = new PortStream(remotePort);
    const clientId = this._getNextClientId();
    const clientStream = this._multiplex.createStream(clientId);

    portStream.pipe(clientStream).pipe(portStream);

    endOfStream(portStream, () =>
      this._onPortStreamEnd(clientId, clientStream),
    );

    this._sendHandshake(remotePort, clientId);
  }

  async _onDisable(state) {
    log.debug('Received desktop disable message');

    await browser.storage.local.set(state);
    log.debug('Synchronised state with desktop');

    log.debug('Restarting extension');
    browser.runtime.reload();
  }

  _connect() {
    const webSocket = this._createWebSocket();
    webSocket.addEventListener('close', () => this._onDisconnect());

    this._webSocketStream = cfg().desktop.webSocket.disableEncryption
      ? new WebSocketStream(webSocket)
      : new EncryptedWebSocketStream(webSocket);

    this._webSocketStream.init();
    this._webSocketStream.pipe(this._multiplex).pipe(this._webSocketStream);

    log.debug('Created web socket connection');
  }

  _onDisconnect() {
    this._webSocketStream = undefined;
  }

  _onPortStreamEnd(clientId, clientStream) {
    log.debug('Port stream closed', clientId);

    clientStream.end();
    this._connectionControllerStream.write({ clientId });
  }

  _sendHandshake(remotePort, clientId) {
    const handshake = {
      clientId,
      remotePort: {
        name: remotePort.name,
        sender: remotePort.sender,
      },
    };

    log.debug('Sending handshake', handshake);

    this._handshakeStream.write(handshake);
  }

  _onBrowserControlMessage(data) {
    switch (data) {
      case BROWSER_ACTION_SHOW_POPUP:
        this._notificationManager.showPopup();
        return;
      default:
        log.debug('Unrecognised browser control message', data);
    }
  }

  _createWebSocket() {
    // eslint-disable-next-line no-undef
    return new WebSocket(`${cfg().desktop.webSocket.url}`);
  }

  _getNextClientId() {
    /* eslint-disable-next-line no-plusplus */
    return this._clientIdCounter++;
  }
}

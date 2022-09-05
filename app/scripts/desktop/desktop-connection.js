import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import ObjectMultiplex from 'obj-multiplex';
import log from 'loglevel';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  BROWSER_ACTION_SHOW_POPUP,
} from '../../../shared/constants/desktop';
import cfg from './config';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';

export default class DesktopConnection {
  constructor(notificationManager) {
    this._notificationManager = notificationManager;
    this._clientIdCounter = 1;
    this._multiplex = new ObjectMultiplex();

    const webSocket = this._createWebSocket();

    log.debug('Created web socket connection');

    const webSocketStream = new EncryptedWebSocketStream(webSocket);

    webSocketStream.pipe(this._multiplex).pipe(webSocketStream);

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

    log.debug('Connected to desktop');
  }

  createStream(remotePort) {
    const portStream = new PortStream(remotePort);
    const clientId = this._getNextClientId();
    const clientStream = this._multiplex.createStream(clientId);

    portStream.pipe(clientStream).pipe(portStream);

    endOfStream(portStream, () =>
      this._onPortStreamEnd(clientId, clientStream),
    );

    this._sendHandshake(remotePort, clientId);
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

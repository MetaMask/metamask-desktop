import { Duplex } from 'stream';
import log from 'loglevel';
import { CLIENT_ID_HANDSHAKES } from '../../../shared/constants/desktop';
import { flattenMessage, sendExtensionAuthentication, verifyDesktopAuthentication } from './utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';

export default class ExtensionStream extends Duplex {
  constructor(webSocket, password, mockState, onAuthenticated) {
    super({ objectMode: true });

    this._webSocketStream = new EncryptedWebSocketStream(webSocket);
    this._password = password;
    this._mockState = mockState;
    this._onAuthenticated = onAuthenticated;
    this._isAuthenticated = false;

    this._webSocketStream.on('data', (data) => this._onMessage(data));
    
    sendExtensionAuthentication(this._webSocketStream, this._password);
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }

  async _onMessage(data) {
    if(!this._isAuthenticated) {
      if(data.authentication) {
        await this._onAuthentication(data.authentication);
        return;
      }
      
      if(!this._isValidUnauthenticatedMessage(data)) {
        log.debug('Ignoring secure message as not authenticated', flattenMessage(data));
        return;
      }
    }

    this.push(data);
  }

  _read() {
    return undefined;
  }

  _write(msg, encoding, cb) {
    if (!this._isAuthenticated) {
      const jsonRpcMethod = msg.data?.data?.method;
      const result = msg.data?.data?.result;

      if (jsonRpcMethod || !result) {
        log.debug('Skipped sending secure message as not authenticated', flattenMessage(msg));
        cb();
        return;
      }

      msg.data.data.result = this._mockState;

      log.debug('Injecting mock state in response');
    }

    this._webSocketStream.write(msg, encoding, cb);
  }

  _isValidUnauthenticatedMessage(message) {
    if (message.name === CLIENT_ID_HANDSHAKES) return true;

    const jsonRpcMethod = message.data?.data?.method;
    if (jsonRpcMethod === 'getState') return true;

    return false;
  }

  async _onAuthentication(authentication, time) {
    log.debug('Received authentication', authentication);

    this._isAuthenticated = verifyDesktopAuthentication(this._password, authentication);

    if(this._isAuthenticated) {
      log.debug('Authentication successful');
    } else {
      log.debug('Authentication failed');
    }

    this._onAuthenticated();
  }
}

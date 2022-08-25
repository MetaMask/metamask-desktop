import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage, verifyExtensionAuthentication, sendDesktopAuthentication } from './utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { CLIENT_ID_HANDSHAKES } from '../../../shared/constants/desktop';

export default class DesktopStream extends Duplex {
  constructor(webSocket) {
    super({ objectMode: true });

    this._webSocketStream = new EncryptedWebSocketStream(webSocket);
    this._isAuthenticated = false;

    this._webSocketStream.on('data', (data) => this._onMessage(data));
  }

  _onMessage(data) {
    if(!this._isAuthenticated && data.authentication) {
        this._authentication = data.authentication;
        log.debug('Received authentication', data.authentication);
        return;
    }

    this.push(data);
  }

  _read() {
    return undefined;
  }

  async _write(msg, encoding, cb) {
    if (!this._isAuthenticated) {
      const jsonRpcMethod = msg.data?.data?.method;

      if (jsonRpcMethod === 'submitPassword') {
        const password = msg.data?.data?.params?.[0];
        await this._onPasswordInput(password);

        if(!this._isAuthenticated) return;
      } else if (jsonRpcMethod !== 'getState' && msg.name !== CLIENT_ID_HANDSHAKES) {
        log.debug(
          'Skipped sending secure message to unauthenticated client',
          flattenMessage(msg),
        );
        cb();
        return;
      }
    }

    this._webSocketStream.write(msg, encoding, cb);
  }

  async _onPasswordInput(password) {
    console.log('Detected password input', password);

    this._isAuthenticated = await verifyExtensionAuthentication(password, this._authentication);

    if(this._isAuthenticated) {
      log.debug('Authentication successful');
      await sendDesktopAuthentication(this._webSocketStream, password);
    } else {
      log.debug('Authentication failed');
    }
  }
}

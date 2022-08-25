import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';
import WebSocketStream from './web-socket-stream';
import { CLIENT_ID_HANDSHAKES } from '../../../shared/constants/desktop';

export default class DesktopStream extends Duplex {
  constructor(webSocket) {
    super({ objectMode: true });

    this._webSocketStream = new WebSocketStream(webSocket);
    this._isEncrypted = false;

    this._webSocketStream.on('data', (data) => this._onMessage(data));
  }

  _onMessage(data) {
    this.push(data);
  }

  _read() {
    return undefined;
  }

  _write(msg, encoding, cb) {
    if (!this._isEncrypted) {
      const jsonRpcMethod = msg.data?.data?.method;

      if (jsonRpcMethod === 'submitPassword') {
        const password = msg.data?.data?.params?.[0];
        console.log('Detected password request', password);
        this._enableEncryption(password);
      } else if (jsonRpcMethod !== 'getState' && msg.name !== CLIENT_ID_HANDSHAKES) {
        log.debug(
          'Skipped sending of insecure decrypted message',
          flattenMessage(msg),
        );
        cb();
        return;
      }
    }

    this._webSocketStream.write(msg, encoding, cb);
  }

  _enableEncryption(secret) {
    this._webSocketStream.setEncryptionSecret(secret);
    this._isEncrypted = true;
  }
}

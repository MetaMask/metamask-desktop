import { Duplex } from 'stream';
import log from 'loglevel';
import { CLIENT_ID_HANDSHAKES } from '../../../shared/constants/desktop';
import { flattenMessage } from './utils';
import WebSocketStream from './web-socket-stream';

export default class ExtensionStream extends Duplex {
  constructor(webSocket, encryptionSecret, mockState, onEncrypted) {
    super({ objectMode: true });

    this._webSocketStream = new WebSocketStream(webSocket);
    this._encryptionSecret = encryptionSecret;
    this._mockState = mockState;
    this._onEncrypted = onEncrypted;
    this._isEncrypted = false;

    this._webSocketStream.on('data', (data) => this._onMessage(data));
  }

  isEncrypted() {
    return this._isEncrypted;
  }

  _onMessage(data) {
    if (!this._isEncrypted) {
      if (this._isEncryptedMessage(data)) {
        log.debug('Detected first encrypted message');
        this._enableEncryption();

        // Re-process the message to decrypt it
        this._webSocketStream._onMessage(data);

        return;
      }

      if (!this._isValidDecryptedMessage(data)) return;
    }

    this.push(data);
  }

  _read() {
    return undefined;
  }

  _write(msg, encoding, cb) {
    if (!this._isEncrypted) {
      const jsonRpcMethod = msg.data?.data?.method;
      const result = msg.data?.data?.result;

      if (jsonRpcMethod || !result) {
        log.debug('Skipped sending of insecure decrypted message', flattenMessage(msg));
        cb();
        return;
      }

      msg.data.data.result = this._mockState;

      log.debug('Injecting mock state in response');
    }

    this._webSocketStream.write(msg, encoding, cb);
  }

  _isValidDecryptedMessage(message) {
    if (message.name === CLIENT_ID_HANDSHAKES) return true;

    const jsonRpcMethod = message.data?.data?.method;
    if (jsonRpcMethod === 'getState') return true;

    log.debug('Ignored insecure decrypted message', flattenMessage(message));

    return false;
  }

  _enableEncryption() {
    this._webSocketStream.setEncryptionSecret(this._encryptionSecret);
    this._isEncrypted = true;
    this._onEncrypted();
  }

  _isEncryptedMessage(message) {
    return typeof message === 'string';
  }
}

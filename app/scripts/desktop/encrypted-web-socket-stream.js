import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';
import { encrypt, decrypt, createKeyPair } from './encryption';
import WebSocketStream from './web-socket-stream';

export default class EncryptedWebSocketStream extends Duplex {
  constructor(webSocket) {
    super({ objectMode: true });
    this._webSocket = webSocket;
  }

  init() {
    this.cork();

    this._webSocketStream = new WebSocketStream(this._webSocket);
    this._webSocketStream.on('data', (data) => this._onMessage(data));

    this._keyPair = createKeyPair();

    this._webSocketStream.write({
      publicKey: this._keyPair.publicKey,
    });
  }

  async _onMessage(data) {
    if (!this._targetPublicKey) {
      if (data.publicKey) {
        this._targetPublicKey = data.publicKey;
        log.debug('Received public key', data.publicKey);
        this.uncork();
      } else {
        log.debug(
          'Ignoring message as waiting for public key',
          flattenMessage(data),
        );
      }

      return;
    }

    log.debug('Received encrypted web socket message');

    let decryptedData;

    try {
      decryptedData = decrypt(data, this._keyPair.privateKey);
    } catch {
      log.debug('Failed to decrypt web socket message');
      return;
    }

    try {
      decryptedData = JSON.parse(decryptedData);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug('Decrypted web socket message', flattenMessage(decryptedData));

    this.push(decryptedData);
  }

  _read() {
    return undefined;
  }

  async _write(msg, encoding, cb) {
    if (!this._targetPublicKey) {
      log.debug(
        'Skipping sending message as waiting for public key',
        flattenMessage(msg),
      );
      cb();
      return;
    }

    log.debug('Sending encrypted message to web socket', flattenMessage(msg));

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const encryptedData = encrypt(rawData, this._targetPublicKey);

    this._webSocketStream.write(encryptedData, encoding, cb);
  }
}

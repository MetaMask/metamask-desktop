import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';
import * as asymmetricEncryption from './asymmetric-encryption';
import * as symmetricEncryption from './symmetric-encryption';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from './web-socket-stream';

export default class EncryptedWebSocketStream extends Duplex {
  private webSocket: BrowserWebSocket | NodeWebSocket;

  private webSocketStream?: WebSocketStream;

  private asymmetricKeyPair?: asymmetricEncryption.KeyPair;

  private targetPublicKey?: string;

  private symmetricKey?: string;

  private targetSymmetricKey?: string;

  constructor(webSocket: BrowserWebSocket | NodeWebSocket) {
    super({ objectMode: true });

    this.webSocket = webSocket;
  }

  async init() {
    this.cork();

    this.webSocketStream = new WebSocketStream(this.webSocket);
    this.webSocketStream.on('data', (data) => this.onMessage(data));

    this.asymmetricKeyPair = asymmetricEncryption.createKeyPair();
    this.symmetricKey = await symmetricEncryption.createKey();

    this.webSocketStream.write({
      publicKey: this.asymmetricKeyPair.publicKey,
    });
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string | undefined, cb: () => void) {
    if (!this.targetPublicKey) {
      log.debug(
        'Skipping sending message as waiting for public key',
        flattenMessage(msg),
      );
      cb();
      return;
    }

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);

    const encryptedData =
      this.symmetricKey && !msg.symmetricKey
        ? await symmetricEncryption.encrypt(rawData, this.symmetricKey)
        : asymmetricEncryption.encrypt(rawData, this.targetPublicKey);

    log.debug('Sending encrypted message to web socket', flattenMessage(msg));

    if (!this.webSocketStream) {
      log.error('Web socket stream not initialised');
      return;
    }

    this.webSocketStream.write(encryptedData, undefined, cb);
  }

  private async onMessage(data: any) {
    if (!this.targetPublicKey) {
      this.onPublicKeyMessage(data);
      return;
    }

    if (!this.targetSymmetricKey) {
      this.onAsymmetricEncryptedMessage(data);
      return;
    }

    await this.onSymmetricEncryptedMessage(data);
  }

  private onPublicKeyMessage(data: any) {
    if (!data.publicKey) {
      log.debug('Ignoring message as waiting for public key');
      return;
    }

    this.targetPublicKey = data.publicKey;

    log.debug('Received public key', this.targetPublicKey);

    this._write(
      { symmetricKey: this.symmetricKey },
      undefined,
      () => undefined,
    );
  }

  private onAsymmetricEncryptedMessage(data: any) {
    log.debug('Received asymmetric encrypted web socket message');

    if (!this.asymmetricKeyPair) {
      log.error('Key pair not created');
      return;
    }

    let decryptedData;

    try {
      decryptedData = asymmetricEncryption.decrypt(
        data,
        this.asymmetricKeyPair.privateKey,
      );
    } catch (error) {
      log.debug('Failed to decrypt asymmetric encrypted web socket message', {
        error,
        data,
      });
      return;
    }

    try {
      decryptedData = JSON.parse(decryptedData);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug(
      'Decrypted asymmetric encrypted web socket message',
      decryptedData,
    );

    if (!decryptedData.symmetricKey) {
      log.debug('Ignoring message as waiting for symmetric key');
      return;
    }

    this.targetSymmetricKey = decryptedData.symmetricKey;

    log.debug('Received symmetric key', this.targetSymmetricKey);

    this.uncork();
  }

  private async onSymmetricEncryptedMessage(data: any) {
    log.debug('Received symmetric encrypted web socket message');

    if (!this.targetSymmetricKey) {
      log.error('Target symmetric key not set');
      return;
    }

    let decryptedData;

    try {
      decryptedData = await symmetricEncryption.decrypt(
        data.data,
        this.targetSymmetricKey,
        data.iv,
      );
    } catch (error) {
      log.debug(
        'Failed to decrypt symmetric encrypted web socket message',
        error,
      );
      return;
    }

    try {
      decryptedData = JSON.parse(decryptedData);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug(
      'Decrypted symmetric encrypted web socket message',
      flattenMessage(decryptedData),
    );

    this.push(decryptedData);
  }
}

import { Duplex } from 'stream';
import log from 'loglevel';
import { flattenMessage } from './utils';
import { encrypt, decrypt, createKeyPair, KeyPair } from './encryption';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from './web-socket-stream';

export default class EncryptedWebSocketStream extends Duplex {
  private webSocket: BrowserWebSocket | NodeWebSocket;

  private webSocketStream?: WebSocketStream;

  private keyPair?: KeyPair;

  private targetPublicKey?: string;

  constructor(webSocket: BrowserWebSocket | NodeWebSocket) {
    super({ objectMode: true });

    this.webSocket = webSocket;
  }

  public init() {
    this.cork();

    this.webSocketStream = new WebSocketStream(this.webSocket);
    this.webSocketStream.on('data', (data) => this.onMessage(data));

    this.keyPair = createKeyPair();

    this.webSocketStream.write({
      publicKey: this.keyPair.publicKey,
    });
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string, cb: () => void) {
    if (!this.targetPublicKey) {
      log.debug(
        'Skipping sending message as waiting for public key',
        flattenMessage(msg),
      );
      cb();
      return;
    }

    log.debug('Sending encrypted message to web socket', flattenMessage(msg));

    if (!this.webSocketStream) {
      log.error('Web socket stream not initialised');
      return;
    }

    const rawData = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const encryptedData = encrypt(rawData, this.targetPublicKey);

    this.webSocketStream.write(encryptedData, undefined, cb);
  }

  private async onMessage(data: any) {
    if (!this.targetPublicKey) {
      if (data.publicKey) {
        this.targetPublicKey = data.publicKey;
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

    if (!this.keyPair) {
      log.error('Key pair not created');
      return;
    }

    let decryptedData;

    try {
      decryptedData = decrypt(data, this.keyPair.privateKey);
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
}

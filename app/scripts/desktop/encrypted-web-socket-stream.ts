import { Duplex } from 'stream';
import log from 'loglevel';
import {
  MESSAGE_HANDSHAKE_FINISH,
  MESSAGE_HANDSHAKE_START,
} from '../../../shared/constants/desktop';
import { flattenMessage } from './utils';
import * as asymmetricEncryption from './asymmetric-encryption';
import * as symmetricEncryption from './symmetric-encryption';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from './web-socket-stream';

enum HandshakeMode {
  START,
  WAIT,
  RECEIVED,
}

export default class EncryptedWebSocketStream extends Duplex {
  private webSocket: BrowserWebSocket | NodeWebSocket;

  private webSocketStream?: WebSocketStream;

  private asymmetricKeyPair?: asymmetricEncryption.KeyPair;

  private symmetricKey?: string;

  private targetPublicKey?: string;

  private targetSymmetricKey?: string;

  private peformingHandshake: boolean;

  constructor(webSocket: BrowserWebSocket | NodeWebSocket) {
    super({ objectMode: true });

    this.webSocket = webSocket;
    this.peformingHandshake = true;
  }

  async init({ startHandshake }: { startHandshake: boolean }) {
    this.webSocketStream = new WebSocketStream(this.webSocket);
    this.webSocketStream.on('data', (data) => this.onMessage(data));

    this.asymmetricKeyPair = asymmetricEncryption.createKeyPair();
    this.symmetricKey = await symmetricEncryption.createKey();

    await this.handshake(
      startHandshake ? HandshakeMode.START : HandshakeMode.WAIT,
    );
  }

  public _read() {
    return undefined;
  }

  public async _write(msg: any, _: string | undefined, cb: () => void) {
    await this.writeSymmetric(msg, cb);
  }

  private async onMessage(data: any) {
    if (this.peformingHandshake) {
      log.debug('Ignoring message as pending handshake');
      return;
    }

    if (data === MESSAGE_HANDSHAKE_START) {
      await this.handshake(HandshakeMode.RECEIVED);
      return;
    }

    const decryptedData = await this.decryptSymmetric(data);
    this.push(decryptedData);
  }

  private async handshake(mode: HandshakeMode) {
    log.debug('Starting handshake');

    this.cork();
    this.pause();

    this.peformingHandshake = true;
    this.targetPublicKey = undefined;
    this.targetSymmetricKey = undefined;

    if (mode === HandshakeMode.START) {
      this.writeRaw(MESSAGE_HANDSHAKE_START);
    }

    if ([HandshakeMode.START, HandshakeMode.WAIT].includes(mode)) {
      await this.waitForMessage(async (data) =>
        data === MESSAGE_HANDSHAKE_START ? data : undefined,
      );

      log.debug('Received handshake');
    }

    if ([HandshakeMode.WAIT, HandshakeMode.RECEIVED].includes(mode)) {
      this.writeRaw(MESSAGE_HANDSHAKE_START);
    }

    this.writeRaw({ publicKey: this.asymmetricKeyPair?.publicKey });

    this.targetPublicKey = await this.waitForMessage((data) => data.publicKey);

    log.debug('Received public key', this.targetPublicKey);

    this.writeAsymmetric({ symmetricKey: this.symmetricKey });

    this.targetSymmetricKey = await this.waitForMessage((data) => {
      const decryptedData = this.decryptAsymmetric(data);
      return decryptedData?.symmetricKey;
    });

    log.debug('Received symmetric key', this.targetSymmetricKey);

    this.writeSymmetric(MESSAGE_HANDSHAKE_FINISH);

    await this.waitForMessage(async (data) => {
      const decryptedData = await this.decryptSymmetric(data);
      return decryptedData === MESSAGE_HANDSHAKE_FINISH ? {} : undefined;
    });

    log.debug('Completed handshake');

    this.uncork();
    this.resume();

    this.peformingHandshake = false;
  }

  private async waitForMessage(
    filter: (data: any) => Promise<any>,
  ): Promise<any> {
    return new Promise((resolve) => {
      const listener = async (data: any) => {
        const finalData = await filter(data);

        if (finalData) {
          this.webSocketStream?.removeListener('data', listener);
          resolve(finalData);
        }
      };

      this.webSocketStream?.on('data', listener);
    });
  }

  private async decryptSymmetric(data: any): Promise<any> {
    if (!this.targetSymmetricKey) {
      log.error('Target symmetric key not set');
      return undefined;
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
      return undefined;
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

    return decryptedData;
  }

  private decryptAsymmetric(data: string): any {
    if (!this.asymmetricKeyPair) {
      log.error('Key pair not created');
      return undefined;
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
      return undefined;
    }

    try {
      decryptedData = JSON.parse(decryptedData);
    } catch {
      // Ignore as data is not a serialised object
    }

    log.debug(
      'Decrypted asymmetric encrypted web socket message',
      flattenMessage(decryptedData),
    );

    return decryptedData;
  }

  private async writeSymmetric(data: string | object, cb?: () => void) {
    if (!this.symmetricKey) {
      log.error('Symmetric key not created');
      return;
    }

    const rawData = typeof data === 'string' ? data : JSON.stringify(data);

    const encrypted = await symmetricEncryption.encrypt(
      rawData,
      this.symmetricKey,
    );

    log.debug('Sending symmetric encrypted message to web socket');

    this.writeRaw(encrypted, cb);
  }

  private writeAsymmetric(data: string | object, cb?: () => void) {
    if (!this.targetPublicKey) {
      log.error('Target public key not set');
      return;
    }

    const rawData = typeof data === 'string' ? data : JSON.stringify(data);

    const encrypted = asymmetricEncryption.encrypt(
      rawData,
      this.targetPublicKey,
    );

    log.debug('Sending asymmetric encrypted message to web socket');

    this.writeRaw(encrypted, cb);
  }

  private writeRaw(rawData: string | object, cb: () => void = () => undefined) {
    if (!this.webSocketStream) {
      log.error('Web socket stream not initialised');
      return;
    }

    this.webSocketStream.write(rawData, undefined, cb);
  }
}

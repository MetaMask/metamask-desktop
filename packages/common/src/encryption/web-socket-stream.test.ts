import {
  MESSAGE_HANDSHAKE_FINISH,
  MESSAGE_HANDSHAKE_START,
} from '../constants';
import { NodeWebSocket, WebSocketStream } from '../web-socket-stream';
import {
  PUBLIC_KEY_MOCK,
  PRIVATE_KEY_MOCK,
  JSON_MOCK,
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketNodeMock,
  createWebSocketStreamMock,
  DECRYPTED_STRING_MOCK,
  KEY_EXPORTED_HEX_MOCK,
  KEY_BYTES_MOCK,
  ENCRYPTED_HEX_MOCK,
  ENCRYPTED_BYTES_MOCK,
  IV_BYTES_MOCK,
} from '../../test/mocks';
import { flushPromises, simulateNodeEvent } from '../../test/utils';
import EncryptedWebSocketStream from './web-socket-stream';
import * as asymmetricEncryption from './asymmetric';
import * as symmetricEncryption from './symmetric';

jest.mock('../web-socket-stream', () => ({
  WebSocketStream: jest.fn(),
}));

jest.mock('./asymmetric', () => ({
  createKeyPair: jest.fn(),
  decrypt: jest.fn(),
  encrypt: jest.fn(),
}));

jest.mock('./symmetric', () => ({
  createKey: jest.fn(),
  decrypt: jest.fn(),
  encrypt: jest.fn(),
}));

describe('Encrypted Web Socket Stream', () => {
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let webSocketMock: jest.Mocked<NodeWebSocket>;
  let asymmetricEncryptionMock: jest.Mocked<typeof asymmetricEncryption>;
  let symmetricEncryptionMock: jest.Mocked<typeof symmetricEncryption>;
  let encryptedWebSocketStream: EncryptedWebSocketStream;

  beforeEach(async () => {
    jest.resetAllMocks();

    webSocketStreamConstructorMock = WebSocketStream;
    webSocketStreamMock = createWebSocketStreamMock();
    webSocketMock = createWebSocketNodeMock();
    asymmetricEncryptionMock = asymmetricEncryption as any;
    symmetricEncryptionMock = symmetricEncryption as any;

    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);

    asymmetricEncryptionMock.createKeyPair.mockReturnValue({
      privateKey: PRIVATE_KEY_MOCK,
      publicKey: PUBLIC_KEY_MOCK,
    });
    asymmetricEncryptionMock.decrypt.mockReturnValue(DECRYPTED_STRING_MOCK);
    asymmetricEncryptionMock.encrypt.mockReturnValue(ENCRYPTED_HEX_MOCK);

    symmetricEncryptionMock.createKey.mockResolvedValue(KEY_BYTES_MOCK);
    symmetricEncryptionMock.decrypt.mockResolvedValue(DECRYPTED_STRING_MOCK);
    symmetricEncryptionMock.encrypt.mockResolvedValue({
      data: ENCRYPTED_BYTES_MOCK,
      iv: IV_BYTES_MOCK,
    });

    asymmetricEncryptionMock.decrypt.mockReturnValueOnce(
      JSON.stringify({
        symmetricKey: KEY_BYTES_MOCK,
      }),
    );

    symmetricEncryptionMock.decrypt.mockResolvedValueOnce(
      MESSAGE_HANDSHAKE_FINISH,
    );

    encryptedWebSocketStream = new EncryptedWebSocketStream(webSocketMock);

    const initPromise = encryptedWebSocketStream.init({
      startHandshake: true,
    });

    await flushPromises();

    await simulateNodeEvent(
      webSocketStreamMock,
      'data',
      MESSAGE_HANDSHAKE_START,
    );

    await simulateNodeEvent(webSocketStreamMock, 'data', {
      publicKey: PUBLIC_KEY_MOCK,
    });

    await simulateNodeEvent(webSocketStreamMock, 'data', {
      symmetricKey: KEY_EXPORTED_HEX_MOCK,
    });

    await simulateNodeEvent(
      webSocketStreamMock,
      'data',
      MESSAGE_HANDSHAKE_FINISH,
    );

    await initPromise;
  });

  describe('init', () => {
    it('creates web socket stream using web socket', async () => {
      expect(webSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );
    });

    it('performs handshake', async () => {
      expect(asymmetricEncryptionMock.createKeyPair).toHaveBeenCalledTimes(1);
      expect(symmetricEncryptionMock.createKey).toHaveBeenCalledTimes(1);

      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
        JSON.stringify({
          symmetricKey: KEY_BYTES_MOCK,
        }),
        PUBLIC_KEY_MOCK,
      );

      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
        MESSAGE_HANDSHAKE_FINISH,
        KEY_BYTES_MOCK,
      );

      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(4);
      expect(webSocketStreamMock.write).toHaveBeenCalledWith(
        MESSAGE_HANDSHAKE_START,
        undefined,
        expect.any(Function),
      );

      expect(webSocketStreamMock.write).toHaveBeenCalledWith(
        { publicKey: PUBLIC_KEY_MOCK },
        undefined,
        expect.any(Function),
      );

      expect(webSocketStreamMock.write).toHaveBeenCalledWith(
        ENCRYPTED_HEX_MOCK,
        undefined,
        expect.any(Function),
      );

      expect(webSocketStreamMock.write).toHaveBeenCalledWith(
        { data: ENCRYPTED_BYTES_MOCK, iv: IV_BYTES_MOCK },
        undefined,
        expect.any(Function),
      );
    });
  });

  describe('on data', () => {
    it.each([
      ['string', STRING_DATA_MOCK, STRING_DATA_MOCK],
      ['object', JSON_MOCK, DATA_MOCK],
    ])(
      'decrypts message and pushes %s',
      async (_, decryptedData, pushedData) => {
        const pushCallback = jest.fn();

        symmetricEncryptionMock.decrypt.mockResolvedValueOnce(decryptedData);

        encryptedWebSocketStream.on('data', pushCallback);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          data: ENCRYPTED_BYTES_MOCK,
          iv: IV_BYTES_MOCK,
        });

        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(3);
        expect(symmetricEncryptionMock.decrypt).toHaveBeenLastCalledWith(
          ENCRYPTED_BYTES_MOCK,
          KEY_BYTES_MOCK,
          IV_BYTES_MOCK,
        );

        expect(pushCallback).toHaveBeenCalledTimes(1);
        expect(pushCallback).toHaveBeenCalledWith(pushedData);
      },
    );
  });

  describe('read', () => {
    it('returns null', () => {
      expect(new EncryptedWebSocketStream(webSocketMock).read()).toBeNull();
    });
  });

  describe('write', () => {
    it.each([
      ['string', DECRYPTED_STRING_MOCK, DECRYPTED_STRING_MOCK],
      ['object', DATA_MOCK, JSON_MOCK],
    ])(
      'encrypts %s message and writes to web socket stream',
      async (_, messageData, valueToEncrypt) => {
        encryptedWebSocketStream.write(messageData);
        await flushPromises();

        expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(2);
        expect(symmetricEncryptionMock.encrypt).toHaveBeenLastCalledWith(
          valueToEncrypt,
          KEY_BYTES_MOCK,
        );

        expect(webSocketStreamMock.write).toHaveBeenCalledTimes(5);
        expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
          { data: ENCRYPTED_BYTES_MOCK, iv: IV_BYTES_MOCK },
          undefined,
          expect.any(Function),
        );
      },
    );
  });
});

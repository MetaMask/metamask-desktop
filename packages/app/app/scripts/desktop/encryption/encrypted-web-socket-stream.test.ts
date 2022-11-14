import { NodeWebSocket, WebSocketStream } from '@metamask/desktop';
import {
  MESSAGE_HANDSHAKE_FINISH,
  MESSAGE_HANDSHAKE_START,
} from '../../../../shared/constants/desktop';
import {
  PUBLIC_KEY_MOCK,
  PRIVATE_KEY_MOCK,
  JSON_MOCK,
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketNodeMock,
  createWebSocketStreamMock,
  EXPORTED_KEY_HEX_MOCK,
  IV_HEX_MOCK,
  DECRYPTED_STRING_MOCK,
  ENCRYPTED_HEX_MOCK,
} from '../test/mocks';
import { flushPromises, simulateNodeEvent } from '../test/utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import * as asymmetricEncryption from './asymmetric-encryption';
import * as symmetricEncryption from './symmetric-encryption';

jest.mock('@metamask/desktop', () => ({ WebSocketStream: jest.fn() }), {
  virtual: true,
});

jest.mock(
  './asymmetric-encryption',
  () => ({
    createKeyPair: jest.fn(),
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  './symmetric-encryption',
  () => ({
    createKey: jest.fn(),
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  }),
  { virtual: true },
);

describe('Encrypted Web Socket Stream', () => {
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let webSocketMock: jest.Mocked<NodeWebSocket>;
  let asymmetricEncryptionMock: jest.Mocked<typeof asymmetricEncryption>;
  let symmetricEncryptionMock: jest.Mocked<typeof symmetricEncryption>;
  let encryptedWebSocketStream;

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

    symmetricEncryptionMock.createKey.mockResolvedValue(EXPORTED_KEY_HEX_MOCK);
    symmetricEncryptionMock.decrypt.mockResolvedValue(DECRYPTED_STRING_MOCK);
    symmetricEncryptionMock.encrypt.mockResolvedValue({
      data: ENCRYPTED_HEX_MOCK,
      iv: IV_HEX_MOCK,
    });

    asymmetricEncryptionMock.decrypt.mockReturnValueOnce(
      JSON.stringify({
        symmetricKey: EXPORTED_KEY_HEX_MOCK,
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
      symmetricKey: EXPORTED_KEY_HEX_MOCK,
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
          symmetricKey: EXPORTED_KEY_HEX_MOCK,
        }),
        PUBLIC_KEY_MOCK,
      );

      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
        MESSAGE_HANDSHAKE_FINISH,
        EXPORTED_KEY_HEX_MOCK,
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
        { data: ENCRYPTED_HEX_MOCK, iv: IV_HEX_MOCK },
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
          data: DATA_MOCK,
          iv: IV_HEX_MOCK,
        });

        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(3);
        expect(symmetricEncryptionMock.decrypt).toHaveBeenLastCalledWith(
          DATA_MOCK,
          EXPORTED_KEY_HEX_MOCK,
          IV_HEX_MOCK,
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
      ['string', STRING_DATA_MOCK, STRING_DATA_MOCK],
      ['object', DATA_MOCK, JSON_MOCK],
    ])(
      'encrypts %s message and writes to web socket stream',
      async (_, messageData, valueToEncrypt) => {
        encryptedWebSocketStream.write(messageData);
        await flushPromises();

        expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(2);
        expect(symmetricEncryptionMock.encrypt).toHaveBeenLastCalledWith(
          valueToEncrypt,
          EXPORTED_KEY_HEX_MOCK,
        );

        expect(webSocketStreamMock.write).toHaveBeenCalledTimes(5);
        expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
          { data: ENCRYPTED_HEX_MOCK, iv: IV_HEX_MOCK },
          undefined,
          expect.any(Function),
        );
      },
    );
  });
});

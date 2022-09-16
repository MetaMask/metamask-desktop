import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { NodeWebSocket, WebSocketStream } from './web-socket-stream';
import * as asymmetricEncryption from './asymmetric-encryption';
import * as symmetricEncryption from './symmetric-encryption';
import {
  PUBLIC_KEY_MOCK,
  PRIVATE_KEY_MOCK,
  ENCRYPTED_STRING_MOCK,
  JSON_MOCK,
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketNodeMock,
  createWebSocketStreamMock,
  EXPORTED_KEY_HEX_MOCK,
  IV_HEX_MOCK,
  DECRYPTED_STRING_MOCK,
  ENCRYPTED_HEX_MOCK,
} from './test/mocks';
import { simulateNodeEvent } from './test/utils';

jest.mock('./web-socket-stream', () => ({ WebSocketStream: jest.fn() }), {
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

  beforeEach(() => {
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
  });

  describe('init', () => {
    it('creates web socket stream using web socket', async () => {
      await new EncryptedWebSocketStream(webSocketMock).init();

      expect(webSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );
    });

    it('generates key pair and sends public key', async () => {
      await new EncryptedWebSocketStream(webSocketMock).init();

      expect(asymmetricEncryptionMock.createKeyPair).toHaveBeenCalledTimes(1);

      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.write).toHaveBeenCalledWith({
        publicKey: PUBLIC_KEY_MOCK,
      });
    });

    it('generates symmetric key', async () => {
      await new EncryptedWebSocketStream(webSocketMock).init();
      expect(symmetricEncryption.createKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('on data', () => {
    it.each([
      ['string', STRING_DATA_MOCK, STRING_DATA_MOCK],
      ['object', JSON_MOCK, DATA_MOCK],
    ])(
      'decrypts message and pushes %s if public key and symmetric key received',
      async (_, decryptedData, pushedData) => {
        asymmetricEncryptionMock.decrypt.mockReturnValueOnce(
          JSON.stringify({ symmetricKey: EXPORTED_KEY_HEX_MOCK }),
        );

        symmetricEncryptionMock.decrypt.mockResolvedValueOnce(decryptedData);

        const pushCallback = jest.fn();

        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );
        await encryptedWebSocketStream.init();
        encryptedWebSocketStream.on('data', pushCallback);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          symmetricKey: EXPORTED_KEY_HEX_MOCK,
        });

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          data: DATA_MOCK,
          iv: IV_HEX_MOCK,
        });

        expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(1);
        expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledWith(
          { symmetricKey: EXPORTED_KEY_HEX_MOCK },
          PRIVATE_KEY_MOCK,
        );

        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(1);
        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledWith(
          DATA_MOCK,
          EXPORTED_KEY_HEX_MOCK,
          IV_HEX_MOCK,
        );

        expect(pushCallback).toHaveBeenCalledTimes(1);
        expect(pushCallback).toHaveBeenCalledWith(pushedData);
      },
    );

    it('sends symmetric key when public key received', async () => {
      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );

      await encryptedWebSocketStream.init();

      await simulateNodeEvent(webSocketStreamMock, 'data', {
        publicKey: PUBLIC_KEY_MOCK,
      });

      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
        JSON.stringify({ symmetricKey: EXPORTED_KEY_HEX_MOCK }),
        PUBLIC_KEY_MOCK,
      );

      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(2);
      expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
        ENCRYPTED_HEX_MOCK,
        undefined,
        expect.any(Function),
      );
    });

    it('ignores message if public key not received', async () => {
      const pushCallback = jest.fn();

      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );

      await encryptedWebSocketStream.init();
      encryptedWebSocketStream.on('data', pushCallback);

      await simulateNodeEvent(
        webSocketStreamMock,
        'data',
        ENCRYPTED_STRING_MOCK,
      );

      expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(0);
      expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(0);
      expect(pushCallback).toHaveBeenCalledTimes(0);
    });

    it('ignores message if public key received but symmetric key not received', async () => {
      const pushCallback = jest.fn();

      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );

      await encryptedWebSocketStream.init();
      encryptedWebSocketStream.on('data', pushCallback);

      await simulateNodeEvent(webSocketStreamMock, 'data', {
        publicKey: PUBLIC_KEY_MOCK,
      });

      await simulateNodeEvent(
        webSocketStreamMock,
        'data',
        ENCRYPTED_STRING_MOCK,
      );

      expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(1);
      expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledWith(
        ENCRYPTED_STRING_MOCK,
        PRIVATE_KEY_MOCK,
      );

      expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(0);
      expect(pushCallback).toHaveBeenCalledTimes(0);
    });
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
      'encrypts %s message and writes to web socket stream if public key and symmetric key received',
      async (_, messageData, valueToEncrypt) => {
        asymmetricEncryptionMock.decrypt.mockReturnValueOnce(
          JSON.stringify({
            symmetricKey: EXPORTED_KEY_HEX_MOCK,
          }),
        );

        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );

        await encryptedWebSocketStream.init();

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          symmetricKey: EXPORTED_KEY_HEX_MOCK,
        });

        encryptedWebSocketStream.write(messageData);

        expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
        expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
          JSON.stringify({ symmetricKey: EXPORTED_KEY_HEX_MOCK }),
          PUBLIC_KEY_MOCK,
        );

        expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
        expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledWith(
          valueToEncrypt,
          EXPORTED_KEY_HEX_MOCK,
        );

        expect(webSocketStreamMock.write).toHaveBeenCalledTimes(2);
        expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
          ENCRYPTED_HEX_MOCK,
          undefined,
          expect.any(Function),
        );
      },
    );

    it('skips write if public key not received', async () => {
      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );
      await encryptedWebSocketStream.init();

      encryptedWebSocketStream.write(DATA_MOCK);

      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(0);
      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
    });

    it('skips write if public key received but symmetric key not received', async () => {
      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );
      await encryptedWebSocketStream.init();

      await simulateNodeEvent(webSocketStreamMock, 'data', {
        publicKey: PUBLIC_KEY_MOCK,
      });

      encryptedWebSocketStream.write(DATA_MOCK);

      expect(asymmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(1);
      expect(symmetricEncryptionMock.encrypt).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(2);
    });
  });
});

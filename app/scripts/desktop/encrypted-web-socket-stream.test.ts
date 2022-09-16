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

    symmetricEncryptionMock.createKey.mockResolvedValue(EXPORTED_KEY_HEX_MOCK);
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
  });

  describe('on data', () => {
    it.each([
      ['string', STRING_DATA_MOCK, STRING_DATA_MOCK],
      ['object', JSON_MOCK, DATA_MOCK],
    ])(
      'decrypts message and returns %s if public key and symmetric key received',
      async (_, messageData, pushedData) => {
        const pushCallback = jest.fn();

        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );
        await encryptedWebSocketStream.init();
        encryptedWebSocketStream.on('data', pushCallback);

        asymmetricEncryptionMock.decrypt.mockImplementationOnce(
          (data: any) => data,
        );

        symmetricEncryptionMock.decrypt.mockImplementationOnce((data: any) =>
          Promise.resolve(data),
        );

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          symmetricKey: EXPORTED_KEY_HEX_MOCK,
        });

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          data: messageData,
          iv: IV_HEX_MOCK,
        });

        expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(1);
        expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledWith(
          { symmetricKey: EXPORTED_KEY_HEX_MOCK },
          PRIVATE_KEY_MOCK,
        );

        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(1);
        expect(symmetricEncryptionMock.decrypt).toHaveBeenCalledWith(
          messageData,
          EXPORTED_KEY_HEX_MOCK,
          IV_HEX_MOCK,
        );

        expect(pushCallback).toHaveBeenCalledTimes(1);
        expect(pushCallback).toHaveBeenCalledWith(pushedData);
      },
    );

    it('ignores message if public key not received', async () => {
      const pushCallback = jest.fn();

      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );
      encryptedWebSocketStream.init();
      encryptedWebSocketStream.on('data', pushCallback);

      await simulateNodeEvent(
        webSocketStreamMock,
        'data',
        ENCRYPTED_STRING_MOCK,
      );

      expect(asymmetricEncryptionMock.decrypt).toHaveBeenCalledTimes(0);
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
      ['string', STRING_DATA_MOCK],
      ['object', DATA_MOCK],
    ])(
      'encrypts %s message and writes to web socket stream if public key and symmetric key received',
      async (_, messageData) => {
        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );
        await encryptedWebSocketStream.init();

        asymmetricEncryptionMock.decrypt.mockImplementation(
          (data: any) => data,
        );
        asymmetricEncryptionMock.encrypt.mockReturnValue(ENCRYPTED_STRING_MOCK);

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

        expect(webSocketStreamMock.write).toHaveBeenCalledTimes(2);
        expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
          ENCRYPTED_STRING_MOCK,
          undefined,
          expect.anything(),
        );
      },
    );

    it('skips write if public key not received', async () => {
      const encryptedWebSocketStream = new EncryptedWebSocketStream(
        webSocketMock,
      );
      await encryptedWebSocketStream.init();

      encryptedWebSocketStream.write(DATA_MOCK);

      expect(asymmetricEncryption.encrypt).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
    });
  });
});

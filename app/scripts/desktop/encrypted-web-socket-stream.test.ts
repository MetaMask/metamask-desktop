import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { NodeWebSocket, WebSocketStream } from './web-socket-stream';
import * as encryption from './encryption';
import {
  PUBLIC_KEY_MOCK,
  PRIVATE_KEY_MOCK,
  ENCRYPTED_STRING_MOCK,
  JSON_MOCK,
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketNodeMock,
  simulateNodeEvent,
  createWebSocketStreamMock,
} from './test/utils';

jest.mock('./web-socket-stream', () => ({ WebSocketStream: jest.fn() }), {
  virtual: true,
});

jest.mock(
  './encryption',
  () => ({
    createKeyPair: jest.fn(),
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  }),
  { virtual: true },
);

describe('Encrypted Web Socket Stream', () => {
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let webSocketMock: jest.Mocked<NodeWebSocket>;
  let encryptionMock: jest.Mocked<typeof encryption>;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketStreamConstructorMock = WebSocketStream;
    webSocketStreamMock = createWebSocketStreamMock();
    webSocketMock = createWebSocketNodeMock();
    encryptionMock = encryption as any;

    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);

    encryptionMock.createKeyPair.mockReturnValue({
      privateKey: PRIVATE_KEY_MOCK,
      publicKey: PUBLIC_KEY_MOCK,
    });
  });

  describe('init', () => {
    it('creates web socket stream using web socket', async () => {
      new EncryptedWebSocketStream(webSocketMock).init();

      expect(webSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );
    });

    it('generates key pair and sends public key', async () => {
      new EncryptedWebSocketStream(webSocketMock).init();

      expect(encryptionMock.createKeyPair).toHaveBeenCalledTimes(1);

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
      'decrypts message and returns %s if public key received',
      async (_, decryptedData, pushedData) => {
        const pushCallback = jest.fn();

        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );
        encryptedWebSocketStream.init();
        encryptedWebSocketStream.on('data', pushCallback);

        encryptionMock.decrypt.mockReturnValue(decryptedData);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        await simulateNodeEvent(
          webSocketStreamMock,
          'data',
          ENCRYPTED_STRING_MOCK,
        );

        expect(encryptionMock.decrypt).toHaveBeenCalledTimes(1);
        expect(encryptionMock.decrypt).toHaveBeenCalledWith(
          ENCRYPTED_STRING_MOCK,
          PRIVATE_KEY_MOCK,
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

      expect(encryptionMock.decrypt).toHaveBeenCalledTimes(0);
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
      'encrypts %s message and writes to web socket stream if public key received',
      async (_, data, dataToEncrypt) => {
        const encryptedWebSocketStream = new EncryptedWebSocketStream(
          webSocketMock,
        );
        encryptedWebSocketStream.init();

        encryptionMock.encrypt.mockReturnValue(ENCRYPTED_STRING_MOCK);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        encryptedWebSocketStream.write(data);

        expect(encryptionMock.encrypt).toHaveBeenCalledTimes(1);
        expect(encryptionMock.encrypt).toHaveBeenCalledWith(
          dataToEncrypt,
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
      encryptedWebSocketStream.init();

      encryptedWebSocketStream.write(DATA_MOCK);

      expect(encryption.encrypt).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
    });
  });
});

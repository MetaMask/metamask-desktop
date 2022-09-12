import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import WebSocketStream from './web-socket-stream';
import { encrypt, decrypt, createKeyPair } from './encryption';
import {
  PUBLIC_KEY_MOCK,
  DECRYPTED_DATA_MOCK,
  PRIVATE_KEY_MOCK,
  ENCRYPTED_STRING_MOCK,
  JSON_MOCK,
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketNodeMock,
  simulateNodeEvent,
  createStreamMock,
} from './test/utils';

jest.mock('./web-socket-stream', () => jest.fn(), { virtual: true });

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
  let webSocketStreamMock;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketStreamMock = createStreamMock();

    WebSocketStream.mockReturnValue(webSocketStreamMock);
    createKeyPair.mockReturnValue({
      privateKey: PRIVATE_KEY_MOCK,
      publicKey: PUBLIC_KEY_MOCK,
    });
  });

  describe('init', () => {
    it('creates web socket stream using web socket', async () => {
      const webSocketMock = createWebSocketNodeMock();

      new EncryptedWebSocketStream(webSocketMock).init();

      expect(WebSocketStream).toHaveBeenCalledTimes(1);
      expect(WebSocketStream).toHaveBeenCalledWith(webSocketMock);
    });

    it('generates key pair and sends public key', async () => {
      new EncryptedWebSocketStream().init();

      expect(createKeyPair).toHaveBeenCalledTimes(1);

      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.write).toHaveBeenCalledWith({
        publicKey: PUBLIC_KEY_MOCK,
      });
    });
  });

  describe('on data', () => {
    it.each([
      ['string', DECRYPTED_DATA_MOCK, DECRYPTED_DATA_MOCK],
      ['object', JSON_MOCK, DATA_MOCK],
    ])(
      'decrypts message and returns %s if public key received',
      async (_, decryptedData, pushedData) => {
        const pushCallback = jest.fn();

        const encryptedWebSocketStream = new EncryptedWebSocketStream();
        encryptedWebSocketStream.init();
        encryptedWebSocketStream.on('data', pushCallback);

        decrypt.mockReturnValue(decryptedData);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        await simulateNodeEvent(
          webSocketStreamMock,
          'data',
          ENCRYPTED_STRING_MOCK,
        );

        expect(decrypt).toHaveBeenCalledTimes(1);
        expect(decrypt).toHaveBeenCalledWith(
          ENCRYPTED_STRING_MOCK,
          PRIVATE_KEY_MOCK,
        );

        expect(pushCallback).toHaveBeenCalledTimes(1);
        expect(pushCallback).toHaveBeenCalledWith(pushedData);
      },
    );

    it('ignores message if public key not received', async () => {
      const pushCallback = jest.fn();

      const encryptedWebSocketStream = new EncryptedWebSocketStream();
      encryptedWebSocketStream.init();
      encryptedWebSocketStream.on('data', pushCallback);

      await simulateNodeEvent(
        webSocketStreamMock,
        'data',
        ENCRYPTED_STRING_MOCK,
      );

      expect(decrypt).toHaveBeenCalledTimes(0);
      expect(pushCallback).toHaveBeenCalledTimes(0);
    });
  });

  describe('read', () => {
    it('returns null', () => {
      expect(new EncryptedWebSocketStream().read()).toBeNull();
    });
  });

  describe('write', () => {
    it.each([
      ['string', STRING_DATA_MOCK, STRING_DATA_MOCK],
      ['object', DATA_MOCK, JSON_MOCK],
    ])(
      'encrypts %s message and writes to web socket stream if public key received',
      async (_, data, dataToEncrypt) => {
        const encryptedWebSocketStream = new EncryptedWebSocketStream();
        encryptedWebSocketStream.init();

        encrypt.mockReturnValue(ENCRYPTED_STRING_MOCK);

        await simulateNodeEvent(webSocketStreamMock, 'data', {
          publicKey: PUBLIC_KEY_MOCK,
        });

        encryptedWebSocketStream.write(data);

        expect(encrypt).toHaveBeenCalledTimes(1);
        expect(encrypt).toHaveBeenCalledWith(dataToEncrypt, PUBLIC_KEY_MOCK);

        expect(webSocketStreamMock.write).toHaveBeenCalledTimes(2);
        expect(webSocketStreamMock.write).toHaveBeenLastCalledWith(
          ENCRYPTED_STRING_MOCK,
          expect.any(String),
          expect.anything(),
        );
      },
    );

    it('skips write if public key not received', async () => {
      const encryptedWebSocketStream = new EncryptedWebSocketStream();
      encryptedWebSocketStream.init();

      encryptedWebSocketStream.write(DATA_MOCK);

      expect(encrypt).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.write).toHaveBeenCalledTimes(1);
    });
  });
});

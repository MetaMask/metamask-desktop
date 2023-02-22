import {
  DECRYPTED_MOCK,
  DECRYPTED_STRING_MOCK,
  ENCRYPTED_BYTES_MOCK,
  ENCRYPTED_MOCK,
  IV_BYTES_MOCK,
  IV_MOCK,
  KEY_BYTES_MOCK,
  KEY_EXPORTED_MOCK,
  KEY_MOCK,
} from '../../test/mocks';
import { createKey, decrypt, encrypt } from './symmetric';

describe('Symmetric Encryption', () => {
  let cryptoMock: jest.Mocked<Crypto>;
  let cryptoSubtleMock: jest.Mocked<SubtleCrypto>;

  beforeEach(() => {
    jest.resetAllMocks();

    cryptoSubtleMock = {
      generateKey: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as any;

    cryptoMock = {
      getRandomValues: jest.fn(),
      subtle: cryptoSubtleMock,
    } as any;

    jest.spyOn(global, 'crypto', 'get').mockImplementation(() => cryptoMock);

    cryptoSubtleMock.importKey.mockResolvedValue(KEY_MOCK);
  });

  describe('createKey', () => {
    it('generates key using global crypto object', async () => {
      cryptoSubtleMock.generateKey.mockResolvedValueOnce(KEY_MOCK);
      cryptoSubtleMock.exportKey.mockResolvedValueOnce(KEY_EXPORTED_MOCK);

      const key = await createKey();

      expect(key).toStrictEqual(KEY_BYTES_MOCK);

      expect(cryptoSubtleMock.generateKey).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.exportKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('encrypt', () => {
    it('encrypts data using global crypto object', async () => {
      cryptoMock.getRandomValues.mockReturnValueOnce(IV_MOCK);
      cryptoSubtleMock.encrypt.mockResolvedValueOnce(ENCRYPTED_MOCK);

      const result = await encrypt(DECRYPTED_STRING_MOCK, KEY_BYTES_MOCK);

      expect(result).toStrictEqual({
        data: ENCRYPTED_BYTES_MOCK,
        iv: IV_BYTES_MOCK,
      });

      expect(cryptoMock.getRandomValues).toHaveBeenCalledTimes(1);

      expect(cryptoSubtleMock.encrypt).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: IV_MOCK },
        KEY_MOCK,
        DECRYPTED_MOCK,
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using global crypto object', async () => {
      cryptoSubtleMock.decrypt.mockResolvedValueOnce(DECRYPTED_MOCK);

      const result = await decrypt(
        ENCRYPTED_BYTES_MOCK,
        KEY_BYTES_MOCK,
        IV_BYTES_MOCK,
      );

      expect(result).toStrictEqual(DECRYPTED_STRING_MOCK);

      expect(cryptoSubtleMock.decrypt).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.decrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: IV_MOCK },
        KEY_MOCK,
        ENCRYPTED_MOCK,
      );
    });
  });
});

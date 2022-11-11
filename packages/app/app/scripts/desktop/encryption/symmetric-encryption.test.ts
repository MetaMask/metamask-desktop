import {
  DECRYPTED_BUFFER_MOCK,
  DECRYPTED_STRING_MOCK,
  ENCRYPTED_BUFFER_MOCK,
  ENCRYPTED_HEX_MOCK,
  EXPORTED_KEY_HEX_MOCK,
  EXPORTED_KEY_MOCK,
  IV_BUFFER_MOCK,
  IV_HEX_MOCK,
  KEY_MOCK,
  STRING_DATA_BUFFER_MOCK,
  STRING_DATA_MOCK,
} from '../test/mocks';
import { createKey, decrypt, encrypt } from './symmetric-encryption';

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
      cryptoSubtleMock.exportKey.mockResolvedValueOnce(EXPORTED_KEY_MOCK);

      const key = await createKey();

      expect(key).toStrictEqual(EXPORTED_KEY_HEX_MOCK);

      expect(cryptoSubtleMock.generateKey).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.exportKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('encrypt', () => {
    it('encrypts data using global crypto object', async () => {
      cryptoMock.getRandomValues.mockReturnValueOnce(IV_BUFFER_MOCK);
      cryptoSubtleMock.encrypt.mockResolvedValueOnce(ENCRYPTED_BUFFER_MOCK);

      const result = await encrypt(STRING_DATA_MOCK, EXPORTED_KEY_HEX_MOCK);

      expect(result).toStrictEqual({
        data: ENCRYPTED_HEX_MOCK,
        iv: IV_HEX_MOCK,
      });

      expect(cryptoMock.getRandomValues).toHaveBeenCalledTimes(1);

      expect(cryptoSubtleMock.encrypt).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: IV_BUFFER_MOCK },
        KEY_MOCK,
        STRING_DATA_BUFFER_MOCK,
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using global crypto object', async () => {
      cryptoSubtleMock.decrypt.mockResolvedValueOnce(DECRYPTED_BUFFER_MOCK);

      const result = await decrypt(
        ENCRYPTED_HEX_MOCK,
        EXPORTED_KEY_HEX_MOCK,
        IV_HEX_MOCK,
      );

      expect(result).toStrictEqual(DECRYPTED_STRING_MOCK);

      expect(cryptoSubtleMock.decrypt).toHaveBeenCalledTimes(1);
      expect(cryptoSubtleMock.decrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: IV_BUFFER_MOCK },
        KEY_MOCK,
        ENCRYPTED_BUFFER_MOCK,
      );
    });
  });
});

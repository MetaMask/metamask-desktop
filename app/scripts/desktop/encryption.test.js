import {
  encrypt as eciesjsEncrypt,
  decrypt as eciesjsDecrypt,
  PrivateKey,
} from 'eciesjs';
import { createKeyPair, encrypt, decrypt } from './encryption';
import {
  ENCRYPTED_STRING_MOCK,
  PRIVATE_KEY_MOCK,
  PUBLIC_KEY_MOCK,
  STRING_DATA_MOCK,
} from './test/utils';

jest.mock(
  'eciesjs',
  () => ({
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    PrivateKey: jest.fn(),
  }),
  { virtual: true },
);

describe('Encryption', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    PrivateKey.mockReturnValue({
      toHex: () => PRIVATE_KEY_MOCK,
      publicKey: { toHex: () => PUBLIC_KEY_MOCK },
    });

    eciesjsEncrypt.mockReturnValue(ENCRYPTED_STRING_MOCK);
    eciesjsDecrypt.mockReturnValue(STRING_DATA_MOCK);
  });

  describe('createKeyPair', () => {
    it('generates private and public key using eciesjs', async () => {
      expect(createKeyPair()).toStrictEqual({
        privateKey: PRIVATE_KEY_MOCK,
        publicKey: PUBLIC_KEY_MOCK,
      });
    });
  });

  describe('encrypt', () => {
    it('encrypts data using eciesjs', async () => {
      expect(encrypt(STRING_DATA_MOCK, PUBLIC_KEY_MOCK)).toStrictEqual(
        ENCRYPTED_STRING_MOCK,
      );
      expect(eciesjsEncrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsEncrypt).toHaveBeenCalledWith(
        PUBLIC_KEY_MOCK,
        Buffer.from(STRING_DATA_MOCK, 'utf8'),
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using eciesjs', async () => {
      expect(decrypt(ENCRYPTED_STRING_MOCK, PRIVATE_KEY_MOCK)).toStrictEqual(
        STRING_DATA_MOCK,
      );
      expect(eciesjsDecrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsDecrypt).toHaveBeenCalledWith(
        PRIVATE_KEY_MOCK,
        Buffer.from(ENCRYPTED_STRING_MOCK, 'hex'),
      );
    });
  });
});

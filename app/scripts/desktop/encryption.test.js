import {
  encrypt as eciesjsEncrypt,
  decrypt as eciesjsDecrypt,
  PrivateKey,
} from 'eciesjs';
import { createKeyPair, encrypt, decrypt } from './encryption';

jest.mock(
  'eciesjs',
  () => ({
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    PrivateKey: jest.fn(),
  }),
  { virtual: true },
);

const PUBLIC_KEY_MOCK = 'testPublicKey';
const PRIVATE_KEY_MOCK = 'testPrivateKey';
const DATA_MOCK = 'testData';
const ENCRYPTED_DATA_MOCK = 'testEncryptedData';

describe('Encryption', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    PrivateKey.mockReturnValue({
      toHex: () => PRIVATE_KEY_MOCK,
      publicKey: { toHex: () => PUBLIC_KEY_MOCK },
    });

    eciesjsEncrypt.mockReturnValue(ENCRYPTED_DATA_MOCK);
    eciesjsDecrypt.mockReturnValue(DATA_MOCK);
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
      expect(encrypt(DATA_MOCK, PUBLIC_KEY_MOCK)).toStrictEqual(
        ENCRYPTED_DATA_MOCK,
      );
      expect(eciesjsEncrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsEncrypt).toHaveBeenCalledWith(
        PUBLIC_KEY_MOCK,
        Buffer.from(DATA_MOCK, 'utf8'),
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using eciesjs', async () => {
      expect(decrypt(ENCRYPTED_DATA_MOCK, PRIVATE_KEY_MOCK)).toStrictEqual(
        DATA_MOCK,
      );
      expect(eciesjsDecrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsDecrypt).toHaveBeenCalledWith(
        PRIVATE_KEY_MOCK,
        Buffer.from(ENCRYPTED_DATA_MOCK, 'hex'),
      );
    });
  });
});

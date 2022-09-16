import eciesjs, { PrivateKey } from 'eciesjs';
import { createKeyPair, encrypt, decrypt } from './encryption';
import {
  ENCRYPTED_STRING_MOCK,
  PRIVATE_KEY_MOCK,
  PUBLIC_KEY_MOCK,
  STRING_DATA_MOCK,
} from './test/mocks';

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
  let eciesjsMock: jest.Mocked<typeof eciesjs>;

  beforeEach(() => {
    jest.resetAllMocks();

    eciesjsMock = eciesjs as any;

    eciesjsMock.PrivateKey.mockReturnValue({
      toHex: () => PRIVATE_KEY_MOCK,
      publicKey: { toHex: () => PUBLIC_KEY_MOCK },
    } as PrivateKey);

    eciesjsMock.encrypt.mockReturnValue(Buffer.from(ENCRYPTED_STRING_MOCK));
    eciesjsMock.decrypt.mockReturnValue(Buffer.from(STRING_DATA_MOCK));
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
      const result = encrypt(STRING_DATA_MOCK, PUBLIC_KEY_MOCK);

      expect(result).toStrictEqual(
        Buffer.from(ENCRYPTED_STRING_MOCK).toString('hex'),
      );

      expect(eciesjsMock.encrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsMock.encrypt).toHaveBeenCalledWith(
        PUBLIC_KEY_MOCK,
        Buffer.from(STRING_DATA_MOCK, 'utf8'),
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using eciesjs', async () => {
      const result = decrypt(ENCRYPTED_STRING_MOCK, PRIVATE_KEY_MOCK);

      expect(result).toStrictEqual(STRING_DATA_MOCK);

      expect(eciesjsMock.decrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsMock.decrypt).toHaveBeenCalledWith(
        PRIVATE_KEY_MOCK,
        Buffer.from(ENCRYPTED_STRING_MOCK, 'hex'),
      );
    });
  });
});

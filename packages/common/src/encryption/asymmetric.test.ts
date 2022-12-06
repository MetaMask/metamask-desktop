import eciesjs from 'eciesjs';
import {
  ENCRYPTED_BUFFER_MOCK,
  ENCRYPTED_HEX_MOCK,
  PRIVATE_KEY_MOCK,
  PUBLIC_KEY_MOCK,
  STRING_DATA_BUFFER_MOCK,
  STRING_DATA_MOCK,
} from '../../test/mocks';
import { createKeyPair, encrypt, decrypt } from './asymmetric';

jest.mock('eciesjs', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  PrivateKey: jest.fn(),
}));

describe('Asymmetric Encryption', () => {
  let eciesjsMock: jest.Mocked<typeof eciesjs>;

  beforeEach(() => {
    jest.resetAllMocks();

    eciesjsMock = eciesjs as any;
  });

  describe('createKeyPair', () => {
    it('generates private and public key using eciesjs', async () => {
      eciesjsMock.PrivateKey.mockReturnValue({
        toHex: () => PRIVATE_KEY_MOCK,
        publicKey: { toHex: () => PUBLIC_KEY_MOCK },
      } as eciesjs.PrivateKey);

      const result = createKeyPair();

      expect(result).toStrictEqual({
        privateKey: PRIVATE_KEY_MOCK,
        publicKey: PUBLIC_KEY_MOCK,
      });
    });
  });

  describe('encrypt', () => {
    it('encrypts data using eciesjs', async () => {
      eciesjsMock.encrypt.mockReturnValue(ENCRYPTED_BUFFER_MOCK);

      const result = encrypt(STRING_DATA_MOCK, PUBLIC_KEY_MOCK);

      expect(result).toStrictEqual(ENCRYPTED_HEX_MOCK);

      expect(eciesjsMock.encrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsMock.encrypt).toHaveBeenCalledWith(
        PUBLIC_KEY_MOCK,
        STRING_DATA_BUFFER_MOCK,
      );
    });
  });

  describe('decrypt', () => {
    it('decrypts data using eciesjs', async () => {
      eciesjsMock.decrypt.mockReturnValue(STRING_DATA_BUFFER_MOCK);

      const result = decrypt(ENCRYPTED_HEX_MOCK, PRIVATE_KEY_MOCK);

      expect(result).toStrictEqual(STRING_DATA_MOCK);

      expect(eciesjsMock.decrypt).toHaveBeenCalledTimes(1);
      expect(eciesjsMock.decrypt).toHaveBeenCalledWith(
        PRIVATE_KEY_MOCK,
        ENCRYPTED_BUFFER_MOCK,
      );
    });
  });
});

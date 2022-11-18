import {
  HASH_BUFFER_HEX_MOCK,
  HASH_BUFFER_MOCK,
  IV_BUFFER_MOCK,
  STRING_DATA_MOCK,
} from '../../test/mocks';
import { hashString, randomHex } from './crypto';

describe('Crypto Utils', () => {
  const cryptoMock = {
    getRandomValues: jest.fn(),
    subtle: {
      digest: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(global, 'crypto', 'get').mockImplementation(() => cryptoMock);
  });

  describe('randomHex', () => {
    it('returns random hex', () => {
      cryptoMock.getRandomValues.mockReturnValueOnce(IV_BUFFER_MOCK);
      const result = randomHex();
      expect(result).toBeDefined();
    });
  });

  describe('hashString', () => {
    it('returns hex of hash from global crypto object', async () => {
      cryptoMock.subtle.digest.mockResolvedValueOnce(HASH_BUFFER_MOCK);

      const result = await hashString(STRING_DATA_MOCK);

      expect(result).toStrictEqual(HASH_BUFFER_HEX_MOCK);

      expect(cryptoMock.subtle.digest).toHaveBeenCalledTimes(1);
      expect(cryptoMock.subtle.digest).toHaveBeenCalledWith(
        'SHA-512',
        Buffer.from(STRING_DATA_MOCK, 'utf8'),
      );
    });

    it('uses hex buffer if isHex true', async () => {
      cryptoMock.subtle.digest.mockResolvedValueOnce(HASH_BUFFER_MOCK);

      await hashString(STRING_DATA_MOCK, { isHex: true });

      expect(cryptoMock.subtle.digest).toHaveBeenCalledTimes(1);
      expect(cryptoMock.subtle.digest).toHaveBeenCalledWith(
        'SHA-512',
        Buffer.from(STRING_DATA_MOCK, 'hex'),
      );
    });
  });
});

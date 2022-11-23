import { TOTP as TOTPAuth } from 'otpauth';
import { OTP_MOCK, WRONG_OTP_MOCK } from '../../test/mocks';
import TOTP from './totp';

describe('TOTP', () => {
  let validateMock: jest.SpyInstance;
  let generateMock: jest.SpyInstance;
  let initMock: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    validateMock = jest.spyOn(TOTPAuth, 'validate').mockImplementation(() => 0);
    generateMock = jest
      .spyOn(TOTPAuth, 'generate')
      .mockImplementation(() => OTP_MOCK);
    initMock = jest.spyOn(TOTP as any, 'init');
  });

  it('generates OTP', async () => {
    const response = TOTP.generate();

    expect(response).toStrictEqual(OTP_MOCK);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('validates OTP', async () => {
    const response = TOTP.validate(OTP_MOCK);

    expect(response).toBe(true);
    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith({
      token: OTP_MOCK,
      window: 1,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: expect.anything(),
      timestamp: undefined,
    });
  });

  it('resets TOTP instance after exceed the max attempts within 30 seconds', async () => {
    for (let i = 0; i < 10; i++) {
      TOTP.validate(WRONG_OTP_MOCK);
      expect(validateMock).toHaveBeenCalled();
    }
    expect(validateMock).toHaveBeenCalledTimes(10);
    expect(initMock).toHaveBeenCalledTimes(1);
  });
});

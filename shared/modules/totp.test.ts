import { TOTP } from 'otpauth';
import * as totp from './totp';

const OTPMock = '123456';

describe('TOTP', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(TOTP, 'validate').mockImplementation(() => 0);
    jest.spyOn(TOTP, 'generate').mockImplementation(() => OTPMock);
  });

  it('generates OTP', async () => {
    const response = totp.generate();

    expect(response).toBeDefined();
    expect(TOTP.generate).toHaveBeenCalledTimes(1);
  });

  it('validates OTP', async () => {
    const response = totp.validate(OTPMock);

    expect(response).toBe(true);
    expect(TOTP.validate).toHaveBeenCalledTimes(1);
    expect(TOTP.validate).toHaveBeenCalledWith({
      token: OTPMock,
      window: 1,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: expect.anything(),
      timestamp: undefined,
    });
  });
});



import { TOTP as TOTPAuth } from 'otpauth';
import TOTP from './totp';

const OTPMock = '123456';

describe('TOTP', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(TOTPAuth, 'validate').mockImplementation(() => 0);
    jest.spyOn(TOTPAuth, 'generate').mockImplementation(() => OTPMock);
  });

  it('generates OTP', async () => {
    const response = TOTP.generate();

    expect(response).toBeDefined();
    expect(TOTP.generate).toHaveBeenCalledTimes(1);
  });

  it('validates OTP', async () => {
    const response = TOTP.validate(OTPMock);

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
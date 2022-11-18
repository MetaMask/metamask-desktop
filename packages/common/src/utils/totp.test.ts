import { TOTP as TOTPAuth } from 'otpauth';
import { OTP_MOCK } from '../../test/mocks';
import TOTP from './totp';

describe('TOTP', () => {
  let validateMock;
  let generateMock;

  beforeEach(() => {
    jest.resetAllMocks();
    validateMock = jest.spyOn(TOTPAuth, 'validate').mockImplementation(() => 0);
    generateMock = jest
      .spyOn(TOTPAuth, 'generate')
      .mockImplementation(() => OTP_MOCK);
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
});

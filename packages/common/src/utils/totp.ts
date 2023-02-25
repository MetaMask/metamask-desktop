import * as OTPAuth from 'otpauth';
import { randomHex } from './crypto';

export const MAX_TOTP_VALIDATE_RETRY_IN_30_SECONDS = 5;
class TOTP {
  private static instance: OTPAuth.TOTP;

  private static validateAttemptsCounter = 0;

  constructor() {
    this.init({ resetInstance: false });
  }

  public generate = (): string => {
    // reset counter
    this.resetAttemptsCounter();
    return TOTP.instance.generate();
  };

  public validate = (token: string): boolean => {
    const result = TOTP.instance.validate({
      token,
      window: 1,
    });

    // Increase attempts counter
    TOTP.validateAttemptsCounter += 1;
    if (this.hasReachedMaxValidateAttempts(TOTP.validateAttemptsCounter)) {
      this.init({ resetInstance: true });
    }

    return result !== null;
  };

  private hasReachedMaxValidateAttempts = (counter: number): boolean => {
    return counter >= MAX_TOTP_VALIDATE_RETRY_IN_30_SECONDS;
  };

  private resetAttemptsCounter = () => {
    TOTP.validateAttemptsCounter = 0;
  };

  private init = (opts: { resetInstance: boolean }) => {
    const { resetInstance } = opts;
    if (!TOTP.instance || resetInstance) {
      TOTP.instance = new OTPAuth.TOTP({
        issuer: 'MM',
        label: 'MetaMask',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromHex(randomHex()),
      });

      // reset counter
      this.resetAttemptsCounter();
    }
  };
}

export default new TOTP();

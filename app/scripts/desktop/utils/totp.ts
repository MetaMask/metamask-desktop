import * as OTPAuth from 'otpauth';
import { randomHex } from './crypto';

class TOTP {
  private static instance: OTPAuth.TOTP;

  constructor() {
    if (!TOTP.instance) {
      TOTP.instance = new OTPAuth.TOTP({
        issuer: 'MM',
        label: 'MetaMask',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromHex(randomHex()),
      });
    }
  }

  public generate = () => {
    return TOTP.instance.generate();
  };

  public validate = (token: string) => {
    const result = TOTP.instance.validate({
      token,
      window: 1,
    });

    return result !== null;
  };
}

export default new TOTP();

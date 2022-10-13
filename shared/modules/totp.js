import * as OTPAuth from 'otpauth';
import createId from './random-id';

let totp;

const init = () => {
  const secretKey = createId();
  return new OTPAuth.TOTP({
    issuer: 'MM',
    label: 'MetaMask',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secretKey,
  });
};

const hasInstance = () => {
  if (!totp) {
    totp = init();
  }
};

export const generate = () => {
  hasInstance();
  return totp.generate();
};

export const validate = (token) => {
  hasInstance();

  const result = totp.validate({
    token,
    window: 1,
  });

  return result !== null;
};

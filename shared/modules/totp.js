import * as OTPAuth from 'otpauth';
import createId from './random-id';

let totp;

const newTOTP = () => {
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

export const generate = () => {
  if (!totp) {
    totp = newTOTP();
  }
  return totp.generate();
};

export const validate = (token) => {
  if (!totp) {
    totp = newTOTP();
  }
  return totp.validate({
    token,
    window: 1,
  });
};

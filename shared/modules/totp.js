import * as OTPAuth from 'otpauth';

let totp;

const generateRandomSecret = () => {
  const randomValue = global.crypto.getRandomValues(new Uint8Array(12));
  const secretKey = Buffer.from(randomValue).toString('hex');
  return OTPAuth.Secret.fromHex(secretKey);
};

const init = () => {
  return new OTPAuth.TOTP({
    issuer: 'MM',
    label: 'MetaMask',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: generateRandomSecret(),
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

  return result === 0;
};

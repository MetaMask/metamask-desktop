import {
  encrypt as _encrypt,
  decrypt as _decrypt,
  generatePrivate,
  getPublic,
} from 'eccrypto';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export const createKeyPair = () => {
  const privateKey = generatePrivate();
  const publicKey = getPublic(privateKey).toString('hex');

  return {
    privateKey,
    publicKey,
  };
};

export const encrypt = async (
  data: string,
  publicKey: string,
): Promise<string> => {
  const publicKeyBuffer = Buffer.from(publicKey, 'hex');
  const dataBuffer = Buffer.from(data, 'utf8');
  const encrypted = await _encrypt(publicKeyBuffer, dataBuffer);

  return [
    encrypted.iv.toString('hex'),
    encrypted.ephemPublicKey.toString('hex'),
    encrypted.ciphertext.toString('hex'),
    encrypted.mac.toString('hex'),
  ].join('#');
};

export const decrypt = async (
  data: string,
  privateKey: string,
): Promise<string> => {
  const buffers = data.split('#');

  const finalData = {
    iv: Buffer.from(buffers[0], 'hex'),
    ephemPublicKey: Buffer.from(buffers[1], 'hex'),
    ciphertext: Buffer.from(buffers[2], 'hex'),
    mac: Buffer.from(buffers[3], 'hex'),
  };

  return (await _decrypt(privateKey, finalData)).toString('utf8');
};

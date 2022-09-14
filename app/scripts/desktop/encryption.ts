import { encrypt as _encrypt, decrypt as _decrypt, PrivateKey } from 'eciesjs';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export const createKeyPair = (): KeyPair => {
  const privateKey = new PrivateKey();
  const { publicKey } = privateKey;

  return {
    privateKey: privateKey.toHex(),
    publicKey: publicKey.toHex(),
  };
};

export const encrypt = (data: string, publicKey: string): string => {
  return _encrypt(publicKey, Buffer.from(data, 'utf8')).toString('hex');
};

export const decrypt = (data: string, privateKey: string): string => {
  return _decrypt(privateKey, Buffer.from(data, 'hex')).toString('utf8');
};

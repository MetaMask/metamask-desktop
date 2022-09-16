import * as eciesjs from 'eciesjs';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export const createKeyPair = (): KeyPair => {
  const privateKeyObject = new eciesjs.PrivateKey();
  const publicKeyObject = privateKeyObject.publicKey;
  const privateKey = privateKeyObject.toHex();
  const publicKey = publicKeyObject.toHex();

  return { privateKey, publicKey };
};

export const encrypt = (data: string, publicKeyHex: string): string => {
  const dataBuffer = Buffer.from(data, 'utf8');
  const encryptedBuffer = eciesjs.encrypt(publicKeyHex, dataBuffer);

  return encryptedBuffer.toString('hex');
};

export const decrypt = (dataHex: string, privateKeyHex: string): string => {
  const dataBuffer = Buffer.from(dataHex, 'hex');
  const decryptedBuffer = eciesjs.decrypt(privateKeyHex, dataBuffer);

  return decryptedBuffer.toString('utf8');
};

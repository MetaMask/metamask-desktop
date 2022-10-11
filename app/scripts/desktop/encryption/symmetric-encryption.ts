const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const KEY_FORMAT = 'raw';
const KEY_USAGES: KeyUsage[] = ['encrypt', 'decrypt'];

const deserializeKey = async (keyHex: string): Promise<CryptoKey> => {
  const keyBuffer = Buffer.from(keyHex, 'hex');

  const key = await global.crypto.subtle.importKey(
    KEY_FORMAT,
    keyBuffer,
    { name: ALGORITHM },
    false,
    KEY_USAGES,
  );

  return key;
};

export const createKey = async (): Promise<string> => {
  const key = await global.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    KEY_USAGES,
  );

  const keyBuffer = await global.crypto.subtle.exportKey(KEY_FORMAT, key);
  const keyHex = Buffer.from(keyBuffer).toString('hex');

  return keyHex;
};

export const encrypt = async (data: string, keyHex: string) => {
  const iv = global.crypto.getRandomValues(new Uint8Array(12));
  const ivHex = Buffer.from(iv).toString('hex');
  const key = await deserializeKey(keyHex);
  const dataBuffer = Buffer.from(data, 'utf8');

  const encryptedArrayBuffer = await global.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataBuffer,
  );

  const encryptedHex = Buffer.from(encryptedArrayBuffer).toString('hex');

  return { data: encryptedHex, iv: ivHex };
};

export const decrypt = async (
  data: string,
  keyHex: string,
  ivHex: string,
): Promise<string> => {
  const iv = Buffer.from(ivHex, 'hex');
  const key = await deserializeKey(keyHex);
  const dataBuffer = Buffer.from(data, 'hex');

  const decryptedArrayBuffer = await global.crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    dataBuffer,
  );

  const decryptedString = Buffer.from(decryptedArrayBuffer).toString('utf8');

  return decryptedString;
};

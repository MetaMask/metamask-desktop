const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const KEY_FORMAT = 'raw';
const KEY_USAGES: KeyUsage[] = ['encrypt', 'decrypt'];

const deserializeKey = async (keyBytes: number[]): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(keyBytes);

  const key = await global.crypto.subtle.importKey(
    KEY_FORMAT,
    keyBuffer,
    { name: ALGORITHM },
    false,
    KEY_USAGES,
  );

  return key;
};

export const createKey = async (): Promise<number[]> => {
  const key = await global.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    KEY_USAGES,
  );

  const keyBuffer = await global.crypto.subtle.exportKey(KEY_FORMAT, key);
  const keyBytes = Array.from(new Uint8Array(keyBuffer));

  return keyBytes;
};

export const encrypt = async (data: string, keyBytes: number[]) => {
  const iv = global.crypto.getRandomValues(new Uint8Array(12));
  const key = await deserializeKey(keyBytes);
  const dataBuffer = new TextEncoder().encode(data);

  const encrypted = await global.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataBuffer,
  );

  const encryptedBytes = Array.from(new Uint8Array(encrypted));
  const ivBytes = Array.from(iv);

  return { data: encryptedBytes, iv: ivBytes };
};

export const decrypt = async (
  dataBytes: number[],
  keyBytes: number[],
  ivBytes: number[],
): Promise<string> => {
  const key = await deserializeKey(keyBytes);
  const data = Uint8Array.from(dataBytes);
  const iv = Uint8Array.from(ivBytes);

  const decrypted = await global.crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  const decryptedString = new TextDecoder().decode(decrypted);

  return decryptedString;
};

const keysByHex: { [hex: string]: CryptoKey } = {};

const deserializeKey = async (keyHex: string): Promise<CryptoKey> => {
  let key = keysByHex[keyHex];

  if (!key) {
    const keyBuffer = Buffer.from(keyHex, 'hex');

    key = await global.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );

    keysByHex[keyHex] = key;
  }

  return key;
};

export const createKey = async (): Promise<string> => {
  const key = await global.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const keyBuffer = await global.crypto.subtle.exportKey('raw', key);
  const keyHex = Buffer.from(keyBuffer).toString('hex');

  keysByHex[keyHex] = key;

  return keyHex;
};

export const encrypt = async (data: string, keyHex: string) => {
  const iv = global.crypto.getRandomValues(new Uint8Array(12));
  const ivHex = Buffer.from(iv).toString('hex');
  const key = await deserializeKey(keyHex);
  const dataBuffer = Buffer.from(data, 'utf8');

  const encryptedArrayBuffer = await global.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
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
    { name: 'AES-GCM', iv },
    key,
    dataBuffer,
  );

  const decryptedString = Buffer.from(decryptedArrayBuffer).toString('utf8');

  return decryptedString;
};

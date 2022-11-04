export const hashString = async (
  dataString: string,
  { isHex = false } = {},
) => {
  const encoding = isHex ? 'hex' : 'utf8';
  const dataBuffer = Buffer.from(dataString, encoding);

  const hashArrayBuffer = await global.crypto.subtle.digest(
    'SHA-512',
    dataBuffer,
  );

  const hashBuffer = Buffer.from(hashArrayBuffer);

  return hashBuffer.toString('hex');
};

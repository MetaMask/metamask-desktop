import * as asymmetricEncryption from '../asymmetric-encryption';
import * as symmetricEncryption from '../symmetric-encryption';
import * as eccryptoEncryption from './alternates/encryption-eccrypto';
import { run } from './utils';

const DATA =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const eciesjs = (iterations: number) => {
  const keyPair = asymmetricEncryption.createKeyPair();

  for (let i = 0; i < iterations; i++) {
    const encrypted = asymmetricEncryption.encrypt(DATA, keyPair.publicKey);
    asymmetricEncryption.decrypt(encrypted, keyPair.privateKey);
  }
};

const eccrypto = async (iterations: number) => {
  const keyPair = eccryptoEncryption.createKeyPair();

  for (let i = 0; i < iterations; i++) {
    const encrypted = await eccryptoEncryption.encrypt(DATA, keyPair.publicKey);
    await eccryptoEncryption.decrypt(encrypted, keyPair.privateKey);
  }
};

const aesgcm256 = async (iterations: number) => {
  const key = await symmetricEncryption.createKey();

  for (let i = 0; i < iterations; i++) {
    const encrypted = await symmetricEncryption.encrypt(DATA, key);
    await symmetricEncryption.decrypt(encrypted.data, key, encrypted.iv);
  }
};

run([
  { name: 'eciesjs', test: eciesjs },
  { name: 'eccrypto', test: eccrypto },
  { name: 'AES-GCM 256', test: aesgcm256 },
]);

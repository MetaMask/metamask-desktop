import { randomBytes } from 'crypto';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import Store from 'electron-store';
import { app } from 'electron';
import log from 'loglevel';
import cfg from '../utils/config';

console.log("test")

let safeStorage: Electron.SafeStorage;

if (!cfg().isExtensionTest && !cfg().isAppTest) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  safeStorage = require('electron').safeStorage;
}

const KEY_LENGTH = 32;
const ENCRYPTED_CYPHER_FILE = 'electron_store_cipher';
const DEAFULT_ELECTRON_USER_PATH = 'userData';

const createPrivateKey = (size: number = KEY_LENGTH): Buffer => {
  return randomBytes(size);
};

export const encryptedCypherFilePath = () => {
  const defaultCwd = app.getPath(DEAFULT_ELECTRON_USER_PATH);
  return path.join(defaultCwd, ENCRYPTED_CYPHER_FILE);
};

const savePrivateKey = async (): Promise<string> => {
  const pk = createPrivateKey().toString('hex');
  const encryptedCypher = safeStorage.encryptString(pk);
  await writeFile(encryptedCypherFilePath(), encryptedCypher);

  return pk;
};

const getPrivateKey = async (): Promise<string> => {
  try {
    const encryptedCypher = await readFile(encryptedCypherFilePath());
    const pk = safeStorage.decryptString(encryptedCypher);

    return pk;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      log.error('Encrypted cypher file not found!');
      return savePrivateKey();
    }
    throw error;
  }
};

class ObfuscatedStore {
  private initialOptions: Store.Options<Record<string, unknown>>;

  private appStore?: Store<Record<string, unknown>>;

  constructor(initialOptions: Store.Options<Record<string, unknown>> = {}) {
    this.initialOptions = initialOptions;
  }

  public async init(): Promise<Store<Record<string, unknown>>> {
    if (this.appStore) {
      return this.appStore;
    }

    if (
      cfg().isExtensionTest ||
      cfg().isAppTest ||
      !safeStorage.isEncryptionAvailable()
    ) {
      this.appStore = new Store(this.initialOptions);
      return this.appStore;
    }

    const pk = await getPrivateKey();

    this.appStore = new Store({
      ...this.initialOptions,
      encryptionKey: pk,
    });

    return this.appStore;
  }

  public async getStore(): Promise<Record<string, unknown>> {
    if (!this.appStore) {
      await this.init();
    }

    // Guaranteed to exist as above init will set
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.appStore!.store;
  }

  public async setStore(data: Record<string, unknown>) {
    if (!this.appStore) {
      await this.init();
    }

    // Guaranteed to exist as above init will set
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.appStore!.store = data;
  }

  public async clear() {
    if (!this.appStore) {
      await this.init();
    }

    this.appStore?.clear();
  }
}

export default new ObfuscatedStore();

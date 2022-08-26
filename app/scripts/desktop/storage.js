import { randomBytes } from 'crypto';
import Store from 'electron-store';
import keytar from 'keytar';

const KEY_LENGTH = 32;
const KEYTAR_SETTINGS_KEY_NAME = 'settingsKey';
const KEYTAR_SERVICE = 'MMD';

const createPrivateKey = (size = KEY_LENGTH) => {
  return randomBytes(size);
};

const savePrivateKey = async () => {
  const pk = createPrivateKey().toString('hex');
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_SETTINGS_KEY_NAME, pk);

  return pk;
};

const getPrivateKey = async () => {
  const pk = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_SETTINGS_KEY_NAME);

  if (pk) {
    return pk;
  }

  return savePrivateKey();
};

class ObfuscatedStore {
  initialOptions;

  initialized = false;

  appStore;

  constructor(options) {
    this.initialOptions = options;
  }

  async init() {
    if (this.initialized) {
      return this.appStore;
    }
    const pk = await getPrivateKey();

    this.appStore = new Store({
      ...this.initialOptions,
      encryptionKey: pk,
    });

    this.initialized = true;

    return this.appStore;
  }

  async getStore() {
    if (!this.initialized) {
      await this.init();
    }

    return this.appStore.store;
  }

  async setStore(data) {
    if (!this.initialized) {
      await this.init();
    }

    this.appStore.store = data;
  }
}

export default new ObfuscatedStore();

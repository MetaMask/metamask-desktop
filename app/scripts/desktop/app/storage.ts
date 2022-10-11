import { randomBytes } from 'crypto';
import Store from 'electron-store';
import keytar from 'keytar';

const KEY_LENGTH = 32;
const KEYTAR_SETTINGS_KEY_NAME = 'settingsKey';
const KEYTAR_SERVICE = 'MMD';

const createPrivateKey = (size: number = KEY_LENGTH): Buffer => {
  return randomBytes(size);
};

const savePrivateKey = async (): Promise<string> => {
  const pk = createPrivateKey().toString('hex');
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_SETTINGS_KEY_NAME, pk);

  return pk;
};

const getPrivateKey = async (): Promise<string> => {
  const pk = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_SETTINGS_KEY_NAME);

  if (pk) {
    return pk;
  }

  return savePrivateKey();
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
}

export default new ObfuscatedStore();

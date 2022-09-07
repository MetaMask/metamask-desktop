import { randomBytes } from 'crypto';
import Store from 'electron-store';
import keytar from 'keytar';
import ObfuscatedStore from './storage';

jest.mock('electron-store', () => jest.fn(), { virtual: true });
jest.mock('crypto', () => ({ randomBytes: jest.fn() }), { virtual: true });

jest.mock(
  'keytar',
  () => ({ getPassword: jest.fn(), setPassword: jest.fn() }),
  { virtual: true },
);

const STORE_MOCK = { store: { test: 'value' } };
const NEW_STORE_DATA_MOCK = { test2: 'value2' };
const PASSWORD_MOCK = 'testPassword';

describe('Obfuscated Store', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    ObfuscatedStore.initialized = false;
    ObfuscatedStore.appStore = undefined;
  });

  describe('init', () => {
    it('creates store using existing keytar password', async () => {
      Store.mockReturnValue(STORE_MOCK);
      keytar.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();

      expect(store).toBe(STORE_MOCK);
      expect(Store).toHaveBeenCalledTimes(1);
      expect(Store).toHaveBeenCalledWith({ encryptionKey: PASSWORD_MOCK });
      expect(keytar.getPassword).toHaveBeenCalledTimes(1);
      expect(keytar.getPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    it('creates store with new keytar password', async () => {
      Store.mockReturnValue(STORE_MOCK);
      randomBytes.mockReturnValue({ toString: () => PASSWORD_MOCK });
      keytar.setPassword.mockResolvedValue({});

      const store = await ObfuscatedStore.init();

      expect(store).toBe(STORE_MOCK);
      expect(Store).toHaveBeenCalledTimes(1);
      expect(Store).toHaveBeenCalledWith({ encryptionKey: PASSWORD_MOCK });
      expect(keytar.setPassword).toHaveBeenCalledTimes(1);
      expect(keytar.setPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        PASSWORD_MOCK,
      );
    });
  });

  describe('getStore', () => {
    it('returns store data if initialized', async () => {
      Store.mockReturnValue(STORE_MOCK);
      keytar.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.init();
      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(STORE_MOCK.store);
    });

    it('creates store and returns store data if not initialized', async () => {
      Store.mockReturnValue(STORE_MOCK);
      keytar.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(STORE_MOCK.store);
    });
  });

  describe('setStore', () => {
    it('overrides store data if initialized', async () => {
      Store.mockReturnValue({ ...STORE_MOCK });
      keytar.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();
      await ObfuscatedStore.setStore(NEW_STORE_DATA_MOCK);

      expect(store.store).toBe(NEW_STORE_DATA_MOCK);
    });

    it('creates store and overrides store data if not initialized', async () => {
      const store = { ...STORE_MOCK };

      Store.mockReturnValue(store);
      keytar.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.setStore(NEW_STORE_DATA_MOCK);

      expect(store.store).toBe(NEW_STORE_DATA_MOCK);
    });
  });
});

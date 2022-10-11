import { randomBytes } from 'crypto';
import Store from 'electron-store';
import keytar from 'keytar';
import { DATA_2_MOCK, PASSWORD_MOCK, STORE_MOCK } from '../test/mocks';
import ObfuscatedStore from './storage';

jest.mock('electron-store', () => jest.fn(), { virtual: true });
jest.mock('crypto', () => ({ randomBytes: jest.fn() }), { virtual: true });

jest.mock(
  'keytar',
  () => ({ getPassword: jest.fn(), setPassword: jest.fn() }),
  { virtual: true },
);

describe('Obfuscated Store', () => {
  let electronStoreMock: jest.Mocked<any>;
  let randomBytesMock: jest.Mocked<any>;
  let keytarMock: jest.Mocked<typeof keytar>;

  beforeEach(() => {
    jest.resetAllMocks();

    electronStoreMock = Store as any;
    randomBytesMock = randomBytes;
    keytarMock = keytar as any;

    (ObfuscatedStore as any).appStore = undefined;
  });

  describe('init', () => {
    it('creates store using existing keytar password', async () => {
      electronStoreMock.mockReturnValue(STORE_MOCK);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();

      expect(store).toBe(STORE_MOCK);

      expect(electronStoreMock).toHaveBeenCalledTimes(1);
      expect(electronStoreMock).toHaveBeenCalledWith({
        encryptionKey: PASSWORD_MOCK,
      });

      expect(keytarMock.getPassword).toHaveBeenCalledTimes(1);
      expect(keytarMock.getPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    it('creates store with new keytar password', async () => {
      electronStoreMock.mockReturnValue(STORE_MOCK);
      randomBytesMock.mockReturnValue({ toString: () => PASSWORD_MOCK });
      keytarMock.setPassword.mockResolvedValue();

      const store = await ObfuscatedStore.init();

      expect(store).toBe(STORE_MOCK);

      expect(electronStoreMock).toHaveBeenCalledTimes(1);
      expect(electronStoreMock).toHaveBeenCalledWith({
        encryptionKey: PASSWORD_MOCK,
      });

      expect(keytarMock.setPassword).toHaveBeenCalledTimes(1);
      expect(keytarMock.setPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        PASSWORD_MOCK,
      );
    });
  });

  describe('getStore', () => {
    it('returns store data if initialized', async () => {
      electronStoreMock.mockReturnValue(STORE_MOCK);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.init();
      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(STORE_MOCK.store);
    });

    it('creates store and returns store data if not initialized', async () => {
      electronStoreMock.mockReturnValue(STORE_MOCK);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(STORE_MOCK.store);
    });
  });

  describe('setStore', () => {
    it('overrides store data if initialized', async () => {
      electronStoreMock.mockReturnValue({ ...STORE_MOCK });
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();
      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(store.store).toBe(DATA_2_MOCK);
    });

    it('creates store and overrides store data if not initialized', async () => {
      const store = { ...STORE_MOCK };

      electronStoreMock.mockReturnValue(store);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(store.store).toBe(DATA_2_MOCK);
    });
  });
});

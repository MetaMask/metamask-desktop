import { randomBytes } from 'crypto';
import Store from 'electron-store';
import keytar from 'keytar';
import {
  createElectronStoreMock,
  DATA_2_MOCK,
  DATA_MOCK,
  PASSWORD_MOCK,
} from '../test/mocks';
import ObfuscatedStore from './storage';

jest.mock('electron-store', () => jest.fn(), { virtual: true });
jest.mock('crypto', () => ({ randomBytes: jest.fn() }), { virtual: true });

jest.mock(
  'keytar',
  () => ({ getPassword: jest.fn(), setPassword: jest.fn() }),
  { virtual: true },
);

describe('Obfuscated Store', () => {
  const keytarMock = keytar as jest.Mocked<typeof keytar>;
  const electronStoreConstructorMock = Store as jest.MockedClass<typeof Store>;
  const storeMock = createElectronStoreMock();

  const randomBytesMock = randomBytes as jest.MockedFunction<
    typeof randomBytes
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    (ObfuscatedStore as any).appStore = undefined;
  });

  describe('init', () => {
    it('creates store using existing keytar password', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();

      expect(store).toBe(storeMock);

      expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
      expect(electronStoreConstructorMock).toHaveBeenCalledWith({
        encryptionKey: PASSWORD_MOCK,
      });

      expect(keytarMock.getPassword).toHaveBeenCalledTimes(1);
      expect(keytarMock.getPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    it('creates store with new keytar password', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      randomBytesMock.mockReturnValue({ toString: () => PASSWORD_MOCK } as any);
      keytarMock.setPassword.mockResolvedValue();

      const store = await ObfuscatedStore.init();

      expect(store).toBe(storeMock);

      expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
      expect(electronStoreConstructorMock).toHaveBeenCalledWith({
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
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      storeMock.store = DATA_MOCK;

      await ObfuscatedStore.init();
      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(DATA_MOCK);
    });

    it('creates store and returns store data if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      storeMock.store = DATA_MOCK;

      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(DATA_MOCK);
    });
  });

  describe('setStore', () => {
    it('overrides store data if initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      const store = await ObfuscatedStore.init();
      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(store.store).toBe(DATA_2_MOCK);
    });

    it('creates store and overrides store data if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(storeMock.store).toBe(DATA_2_MOCK);
    });
  });

  describe('clear', () => {
    it('calls clear on store', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.init();
      await ObfuscatedStore.clear();

      expect(storeMock.clear).toHaveBeenCalledTimes(1);
    });

    it('creates store and calls clear if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      keytarMock.getPassword.mockResolvedValue(PASSWORD_MOCK);

      await ObfuscatedStore.clear();

      expect(storeMock.clear).toHaveBeenCalledTimes(1);
    });
  });
});

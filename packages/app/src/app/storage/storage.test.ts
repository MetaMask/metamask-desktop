import { randomBytes } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { app, safeStorage } from 'electron';
import Store from 'electron-store';
import {
  createElectronStoreMock,
  DATA_2_MOCK,
  DATA_MOCK,
  PASSWORD_MOCK,
  ENCRYPTED_CYPHER_MOCK,
  ENCRYPTED_CYPHER_FILE_MOCK,
} from '../../../test/mocks';
import ObfuscatedStore from './storage';

jest.mock('electron-store', () => jest.fn(), { virtual: true });
jest.mock('crypto', () => ({ randomBytes: jest.fn() }), { virtual: true });
jest.mock('loglevel');
jest.mock('path', () => ({ join: jest.fn() }), { virtual: true });
jest.mock('fs/promises', () => ({ readFile: jest.fn(), writeFile: jest.fn() }));

jest.mock(
  'electron',
  () => ({
    safeStorage: {
      encryptString: jest.fn(),
      decryptString: jest.fn(),
      isEncryptionAvailable: jest.fn(),
    },
    app: { getPath: jest.fn() },
  }),
  {
    virtual: true,
  },
);

describe('Obfuscated Store', () => {
  const appMock = app as jest.Mocked<typeof app>;
  const safeStorageMock = safeStorage as jest.Mocked<typeof safeStorage>;
  const readFileMock = readFile as jest.MockedFunction<typeof readFile>;
  const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;
  const pathMock = path as jest.Mocked<typeof path>;
  const electronStoreConstructorMock = Store as jest.MockedClass<typeof Store>;
  const storeMock = createElectronStoreMock();

  const randomBytesMock = randomBytes as jest.MockedFunction<
    typeof randomBytes
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    (ObfuscatedStore as any).appStore = undefined;
  });

  describe('init', () => {
    it('creates store using existing encrypted cypher file', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      const store = await ObfuscatedStore.init();

      expect(store).toBe(storeMock);

      expect(safeStorageMock.decryptString).toHaveBeenCalledTimes(1);
      expect(safeStorageMock.decryptString).toHaveBeenCalledWith(
        ENCRYPTED_CYPHER_MOCK,
      );
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledWith(ENCRYPTED_CYPHER_FILE_MOCK);
      expect(writeFileMock).not.toHaveBeenCalled();

      expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
      expect(electronStoreConstructorMock).toHaveBeenCalledWith({
        encryptionKey: PASSWORD_MOCK,
      });
    });

    it('creates store with electron safeStorage and creating a new cypher file', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      randomBytesMock.mockReturnValue({ toString: () => PASSWORD_MOCK } as any);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockRejectedValue({ code: 'ENOENT' });
      safeStorageMock.encryptString.mockReturnValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      const store = await ObfuscatedStore.init();

      expect(store).toBe(storeMock);

      expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
      expect(electronStoreConstructorMock).toHaveBeenCalledWith({
        encryptionKey: PASSWORD_MOCK,
      });

      expect(safeStorageMock.encryptString).toHaveBeenCalledTimes(1);
      expect(safeStorageMock.encryptString).toHaveBeenCalledWith(PASSWORD_MOCK);
      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(writeFile).toHaveBeenCalledWith(
        ENCRYPTED_CYPHER_FILE_MOCK,
        ENCRYPTED_CYPHER_MOCK,
      );
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(safeStorageMock.decryptString).not.toHaveBeenCalled();
    });
  });

  describe('getStore', () => {
    it('returns store data if initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      storeMock.store = DATA_MOCK;

      await ObfuscatedStore.init();
      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(DATA_MOCK);
    });

    it('creates store and returns store data if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      storeMock.store = DATA_MOCK;

      const storeData = await ObfuscatedStore.getStore();

      expect(storeData).toBe(DATA_MOCK);
    });
  });

  describe('setStore', () => {
    it('overrides store data if initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      const store = await ObfuscatedStore.init();
      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(store.store).toBe(DATA_2_MOCK);
    });

    it('creates store and overrides store data if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      await ObfuscatedStore.setStore(DATA_2_MOCK);

      expect(storeMock.store).toBe(DATA_2_MOCK);
    });
  });

  describe('clear', () => {
    it('calls clear on store', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      await ObfuscatedStore.init();
      await ObfuscatedStore.clear();

      expect(storeMock.clear).toHaveBeenCalledTimes(1);
    });

    it('creates store and calls clear if not initialized', async () => {
      electronStoreConstructorMock.mockReturnValue(storeMock);
      appMock.getPath.mockReturnValue('');
      pathMock.join.mockReturnValue(ENCRYPTED_CYPHER_FILE_MOCK);
      readFileMock.mockResolvedValue(ENCRYPTED_CYPHER_MOCK);
      safeStorageMock.decryptString.mockReturnValue(PASSWORD_MOCK);
      safeStorageMock.isEncryptionAvailable.mockReturnValue(true);

      await ObfuscatedStore.clear();

      expect(storeMock.clear).toHaveBeenCalledTimes(1);
    });
  });
});

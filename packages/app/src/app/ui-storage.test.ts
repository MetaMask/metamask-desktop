import { ipcMain } from 'electron';
import Store from 'electron-store';
import { setUiStorage, UiStorageSettings } from './ui-storage';

jest.mock('electron-store', () => jest.fn(), { virtual: true });

jest.mock(
  'electron',
  () => ({
    ipcMain: { handle: jest.fn() },
  }),
  {
    virtual: true,
  },
);

describe('setUiStorage', () => {
  it('test', () => {
    const storeSettings: UiStorageSettings = {
      key: 'test',
      version: '0.0.0',
    };

    setUiStorage(storeSettings);

    expect(Store).toHaveBeenCalledTimes(1);
    expect(Store).toHaveBeenCalledWith({
      name: `mmd-desktop-ui-v${storeSettings.version}-${storeSettings.key}`,
    });

    expect(ipcMain.handle).toHaveBeenCalledTimes(3);

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.key}-store-get`,
      expect.any(Function),
    );

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.key}-store-set`,
      expect.any(Function),
    );

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.key}-store-delete`,
      expect.any(Function),
    );
  });
});

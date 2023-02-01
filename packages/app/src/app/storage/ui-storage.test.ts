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
      name: 'test',
      schemaVersion: '0.0.0',
    };

    setUiStorage(storeSettings);

    expect(Store).toHaveBeenCalledTimes(1);
    expect(Store).toHaveBeenCalledWith({
      name: `mmd-desktop-ui-v${storeSettings.schemaVersion}-${storeSettings.name}`,
    });

    expect(ipcMain.handle).toHaveBeenCalledTimes(3);

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.name}-store-get`,
      expect.any(Function),
    );

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.name}-store-set`,
      expect.any(Function),
    );

    expect(ipcMain.handle).toHaveBeenCalledWith(
      `${storeSettings.name}-store-delete`,
      expect.any(Function),
    );
  });
});

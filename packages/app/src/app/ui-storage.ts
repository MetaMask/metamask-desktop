import { ipcMain } from 'electron';
import Store from 'electron-store';

type versionType = `${number}.${number}.${number}`;

export const setUiStorage = (key: string, version: versionType = '0.0.0') => {
  const pairStatusStore = new Store({
    name: `mmd-desktop-ui-v${version}-${key}`,
  });

  ipcMain.handle(`${key}-store-get`, (_event, key: string) => {
    return pairStatusStore.get(key);
  });

  ipcMain.handle(`${key}-store-set`, (_event, key: string, value) => {
    pairStatusStore.set(key, value);
  });

  ipcMain.handle(`${key}-store-delete`, (_event, key: string) => {
    pairStatusStore.delete(key);
  });
};

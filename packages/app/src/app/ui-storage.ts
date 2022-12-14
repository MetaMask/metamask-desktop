import { ipcMain } from 'electron';
import Store from 'electron-store';

export interface UiStorageSettings {
  key: string;
  schemaVersion: `${number}.${number}.${number}`;
}

export const setUiStorage = ({ key, schemaVersion }: UiStorageSettings) => {
  const uiStore = new Store({
    name: `mmd-desktop-ui-v${schemaVersion}-${key}`,
  });

  ipcMain.handle(`${key}-store-get`, (_event, key: string) => {
    return uiStore.get(key);
  });

  ipcMain.handle(`${key}-store-set`, (_event, key: string, value) => {
    uiStore.set(key, value);
  });

  ipcMain.handle(`${key}-store-delete`, (_event, key: string) => {
    uiStore.delete(key);
  });
};

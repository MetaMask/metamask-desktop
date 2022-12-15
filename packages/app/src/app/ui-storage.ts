import { ipcMain } from 'electron';
import Store from 'electron-store';

export interface UiStorageSettings {
  name: string;
  schemaVersion: `${number}.${number}.${number}`;
}

export const setUiStorage = ({ name, schemaVersion }: UiStorageSettings) => {
  const uiStore = new Store({
    name: `mmd-desktop-ui-v${schemaVersion}-${name}`,
  });

  ipcMain.handle(`${name}-store-get`, (_event, key: string) => {
    return uiStore.get(key);
  });

  ipcMain.handle(`${name}-store-set`, (_event, key: string, value) => {
    uiStore.set(key, value);
  });

  ipcMain.handle(`${name}-store-delete`, (_event, key: string) => {
    uiStore.delete(key);
  });
};

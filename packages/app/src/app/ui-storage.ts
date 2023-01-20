import { ipcMain } from 'electron';
import Store from 'electron-store';
import log from 'loglevel';
import { uiAppStorage } from './ui-constants';

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

export const getUiStorage = ({ name, schemaVersion }: UiStorageSettings) => {
  return new Store({
    name: `mmd-desktop-ui-v${schemaVersion}-${name}`,
  });
};

export const getPreferredStartupState = () => {
  const defaultPreferredStartup = 'minimized';
  const persistedState = getUiStorage(uiAppStorage).get(
    'persist:app',
  ) as string;

  if (!persistedState) {
    log.info('No persisted state found, using default value');
    return defaultPreferredStartup;
  }

  try {
    const { preferredStartup } = JSON.parse(persistedState);
    if (preferredStartup) {
      return preferredStartup;
    }

    log.info(
      'No preferredStartup found in persisted state, using default value',
    );
    return defaultPreferredStartup;
  } catch (error) {
    log.error(
      'Error reading preferredStartup from persisted app state, using default value',
      error,
    );
    return defaultPreferredStartup;
  }
};

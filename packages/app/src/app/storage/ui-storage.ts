import { ipcMain } from 'electron';
import Store from 'electron-store';
import log from 'loglevel';
import { uiAppStorage } from '../ui/ui-constants';

export interface UiStorageSettings {
  name: string;
  schemaVersion: `${number}.${number}.${number}`;
}

export interface PersistedSettingFromStoreOpts {
  defaultValue: any;
  key: string;
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

const getPersistedAppState = () => {
  const persistedAppState = getUiStorage(uiAppStorage).get(
    'persist:app',
  ) as string;

  if (!persistedAppState) {
    log.info('No persisted app state found');
    return null;
  }

  try {
    return JSON.parse(persistedAppState);
  } catch (error) {
    log.error('Error parsing persisted app state', error);
    return null;
  }
};

export const readPersistedSettingFromAppState = ({
  defaultValue,
  key,
}: PersistedSettingFromStoreOpts) => {
  const persistedAppState = getPersistedAppState();

  if (!persistedAppState) {
    log.info(
      `Persisted app state not found, using default value for ${key} : ${defaultValue}`,
    );
    return defaultValue;
  }

  const value = persistedAppState[key];

  if (value) {
    return JSON.parse(value);
  }

  log.info(
    `${key} not found in persisted app state, using default value : ${defaultValue}`,
  );

  return defaultValue;
};

import { combineReducers } from 'redux';
import { persistReducer, createMigrate } from 'redux-persist';

import createElectronStorage from '../helpers/utils/electron-storage';
import { persistedUIStoreKey } from '../helpers/constants/storage';
import pairStatusMigrations from '../migrations/pairStatus';
import rootMigrations from '../migrations/root';
import appReducer from './app/app';
import localesReducer from './locale/locale';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  storage: createElectronStorage({
    name: 'mmd-desktop-ui-v0.0.0-pair-status',
  }),
  blacklist: ['connections', 'isWebSocketConnected'],
  whitelist: ['isDesktopEnabled', 'isSuccessfulPairSeen', 'lastActivation'],
  migrate: createMigrate(pairStatusMigrations, { debug: false }),
  version: 0,
};
const persistedPairStatusReducer = persistReducer(
  pairStatusPersistConfig,
  pairStatusReducer,
);

const rootReducer = combineReducers({
  app: appReducer,
  locales: localesReducer,
  pairStatus: persistedPairStatusReducer,
});

const rootPersistConfig = {
  key: 'root',
  storage: createElectronStorage({
    name: persistedUIStoreKey,
  }),
  whitelist: ['app'],
  migrate: createMigrate(rootMigrations, { debug: false }),
  version: 0,
};
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export default persistedRootReducer;

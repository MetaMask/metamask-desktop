import { combineReducers } from 'redux';
import { persistReducer, createMigrate } from 'redux-persist';

import pairStatusMigrations from '../migrations/pair-status';
import appMigrations from '../migrations/app';
import appReducer from './app/app';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  storage: window.electronBridge.pairStatusStore,
  blacklist: ['connections', 'isWebSocketConnected', 'isDesktopPaired'],
  whitelist: ['isSuccessfulPairSeen', 'lastActivation'],
  migrate: createMigrate(pairStatusMigrations, { debug: false }),
  version: 0,
};
const persistedPairStatusReducer = persistReducer(
  pairStatusPersistConfig,
  pairStatusReducer,
);

const appPersistConfig = {
  key: 'app',
  storage: window.electronBridge.appStore,
  migrate: createMigrate(appMigrations, { debug: false }),
  version: 0,
};
const persistedAppReducer = persistReducer(appPersistConfig, appReducer);

const rootReducer = combineReducers({
  app: persistedAppReducer,
  pairStatus: persistedPairStatusReducer,
});

export default rootReducer;

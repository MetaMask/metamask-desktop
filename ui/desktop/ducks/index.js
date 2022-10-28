import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';

import createElectronStorage from '../helpers/utils/electron-storage';
import appReducer from './app/app';
import localesReducer from './locale/locale';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  storage: createElectronStorage({
    name: 'mmd-desktop-ui-v0.0.0-pair-status',
  }),
  blacklist: ['isPaired', 'connections', 'isWebSocketConnected'],
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
    // Change the number to clear the storage
    name: 'mmd-desktop-ui-v0.0.0-root',
  }),
  whitelist: ['app', 'locales'],
};
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export default persistedRootReducer;

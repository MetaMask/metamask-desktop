import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';

// import createElectronStorage from '../helpers/utils/electron-storage';
// import { persistedUIStoreKey } from '../helpers/constants/storage';
import appReducer from './app/app';
import localesReducer from './locale/locale';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  // storage: createElectronStorage({
  //   name: 'mmd-desktop-ui-v0.0.0-pair-status',
  // }),
  storage: window.electron.pairStatusStore,
  blacklist: ['connections', 'isWebSocketConnected'],
  whitelist: ['isDesktopEnabled', 'isSuccessfulPairSeen', 'lastActivation'],
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
  // storage: createElectronStorage({
  //   name: persistedUIStoreKey,
  // }),
  storage: window.electron.rootStore,
  whitelist: ['app', 'locales'],
};
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export default persistedRootReducer;

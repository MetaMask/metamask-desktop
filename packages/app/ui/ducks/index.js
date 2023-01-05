import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';

import appReducer from './app/app';
import localesReducer from './locale/locale';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  storage: window.electronBridge.pairStatusStore,
  blacklist: ['connections', 'isWebSocketConnected', 'isDesktopEnabled'],
  whitelist: ['isSuccessfulPairSeen', 'lastActivation'],
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
  storage: window.electronBridge.rootStore,
  whitelist: ['app', 'locales'],
};
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export default persistedRootReducer;

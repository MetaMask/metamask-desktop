import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';

import appReducer from './app/app';
import pairStatusReducer from './pair-status/pair-status';

const pairStatusPersistConfig = {
  key: 'pairStatus',
  storage: window.electronBridge.pairStatusStore,
  blacklist: ['connections', 'isWebSocketConnected', 'isDesktopPaired'],
  whitelist: ['isSuccessfulPairSeen', 'lastActivation'],
};
const persistedPairStatusReducer = persistReducer(
  pairStatusPersistConfig,
  pairStatusReducer,
);

const appPersistConfig = {
  key: 'app',
  storage: window.electronBridge.appStore,
};
const persistedAppReducer = persistReducer(appPersistConfig, appReducer);

const rootReducer = combineReducers({
  app: persistedAppReducer,
  pairStatus: persistedPairStatusReducer,
});

export default rootReducer;

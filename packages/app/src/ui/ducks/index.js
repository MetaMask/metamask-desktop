import { combineReducers } from 'redux';
import { persistReducer, createMigrate } from 'redux-persist';

import pairStatusMigrations from '../migrations/pair-status';
import rootMigrations from '../migrations/root';
import sendReducer from '../../submodules/extension/ui/ducks/send/send';
import historyReducer from '../../submodules/extension/ui/ducks/history/history';
import appStateReducer from '../../submodules/extension/ui/ducks/app/app';
import confirmTransactionReducer from '../../submodules/extension/ui/ducks/confirm-transaction/confirm-transaction.duck';
import metamaskReducer from '../../submodules/extension/ui/ducks/metamask/metamask';
import domainsReducer from '../../submodules/extension/ui/ducks/domains';
import gasReducer from '../../submodules/extension/ui/ducks/gas/gas.duck';
import localeMessagesReducer from '../../submodules/extension/ui/ducks/locale/locale';
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
  migrate: createMigrate(rootMigrations, { debug: false }),
  version: 0,
};
const persistedAppReducer = persistReducer(appPersistConfig, appReducer);

const rootReducer = combineReducers({
  app: persistedAppReducer,
  pairStatus: persistedPairStatusReducer,
  metamask: metamaskReducer,
  localeMessages: localeMessagesReducer,
  send: sendReducer,
  history: historyReducer,
  appState: appStateReducer,
  confirmTransaction: confirmTransactionReducer,
  DNS: domainsReducer,
  gas: gasReducer,
});

export default rootReducer;

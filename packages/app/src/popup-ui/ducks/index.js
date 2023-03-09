import { combineReducers } from 'redux';
import { persistReducer, createMigrate } from 'redux-persist';
import appMigrations from '../../ui/migrations/app';
import appReducer from '../../ui/ducks/app/app';
import sendReducer from '../../../submodules/extension/ui/ducks/send/send';
import historyReducer from '../../../submodules/extension/ui/ducks/history/history';
import appStateReducer from '../../../submodules/extension/ui/ducks/app/app';
import confirmTransactionReducer from '../../../submodules/extension/ui/ducks/confirm-transaction/confirm-transaction.duck';
import metamaskReducer from '../../../submodules/extension/ui/ducks/metamask/metamask';
import domainsReducer from '../../../submodules/extension/ui/ducks/domains';
import gasReducer from '../../../submodules/extension/ui/ducks/gas/gas.duck';
import localeMessagesReducer from '../../../submodules/extension/ui/ducks/locale/locale';

const appPersistConfig = {
  key: 'app',
  storage: window.popupElectronBridge.appStore,
  migrate: createMigrate(appMigrations, { debug: false }),
  version: 0,
};

const persistedAppReducer = persistReducer(appPersistConfig, appReducer);

const rootReducer = combineReducers({
  app: persistedAppReducer,
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

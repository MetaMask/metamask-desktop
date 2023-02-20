import { combineReducers } from 'redux';
import sendReducer from '../../../submodules/extension/ui/ducks/send/send';
import historyReducer from '../../../submodules/extension/ui/ducks/history/history';
import appStateReducer from '../../../submodules/extension/ui/ducks/app/app';
import confirmTransactionReducer from '../../../submodules/extension/ui/ducks/confirm-transaction/confirm-transaction.duck';
import metamaskReducer from '../../../submodules/extension/ui/ducks/metamask/metamask';
import domainsReducer from '../../../submodules/extension/ui/ducks/domains';
import gasReducer from '../../../submodules/extension/ui/ducks/gas/gas.duck';
import localeMessagesReducer from '../../../submodules/extension/ui/ducks/locale/locale';

const rootReducer = combineReducers({
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

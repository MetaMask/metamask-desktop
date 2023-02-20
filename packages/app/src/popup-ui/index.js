import React from 'react';
import { render } from 'react-dom';

import { _setBackgroundConnection } from '../../submodules/extension/ui/store/action-queue';
import { IPCMainStream } from '../app/ipc-main-stream';
import metaRPCClientFactory from '../../submodules/extension/app/scripts/lib/metaRPCClientFactory';
import * as actions from './actions';
import configureStore from './store/store';
import Root from './pages';

// eslint-disable-next-line no-empty-function
const noop = () => {};

async function launchPopupUi() {
  global.platform = {
    currentTab: noop,
    closeCurrentWindow: noop,
  };

  const { store } = configureStore();

  window.popupElectronBridge.addBackgroundMessageListener(async (data) => {
    if (data.data?.method !== 'sendUpdate') {
      return;
    }

    store.dispatch(actions.updateState(data.data?.params[0]));
  });

  const backgroundStream = metaRPCClientFactory(
    new IPCMainStream(window.popupElectronBridge),
  );

  _setBackgroundConnection(backgroundStream);

  render(<Root store={store} />, document.getElementById('mmd-popup-root'));
}

export default launchPopupUi;

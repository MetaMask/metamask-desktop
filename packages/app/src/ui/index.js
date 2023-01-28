import React from 'react';
import { render } from 'react-dom';

import { _setBackgroundConnection } from '../submodules/extension/ui/store/action-queue';
import { IPCMainStream } from '../src/app/ipc-main-stream';
import metaRPCClientFactory from '../submodules/extension/app/scripts/lib/metaRPCClientFactory';
import * as actions from './actions';
import configureStore from './store/store';
import Root from './pages';
import registerUpdatePairStatus from './hooks/registerUpdatePairStatus';
import registerUpdateOSTheme from './hooks/registerUpdateOSTheme';
import registerResizedEvent from './hooks/registerResizedEvent';
import registerMovedEvent from './hooks/registerMovedEvent';

async function launchDesktopUi() {
  const { store, persistor } = configureStore();

  // Register listener OS theme change
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', registerUpdateOSTheme(store));

  // Register listeners from the main process to the renderer process
  window.electronBridge.onStatusChange(registerUpdatePairStatus(store));

  // Register window event listeners from the main process
  window.electronBridge.onResized(registerResizedEvent(store));
  window.electronBridge.onMoved(registerMovedEvent(store));

  window.electronBridge.addBackgroundMessageListener(async (data) => {
    if (data.data?.method !== 'sendUpdate') {
      return;
    }

    store.dispatch(actions.updateState(data.data?.params[0]));
  });

  const backgroundStream = metaRPCClientFactory(
    new IPCMainStream(window.electronBridge),
  );

  _setBackgroundConnection(backgroundStream);

  render(
    <Root store={store} persistor={persistor} />,
    document.getElementById('mmd-root'),
  );
}

export default launchDesktopUi;

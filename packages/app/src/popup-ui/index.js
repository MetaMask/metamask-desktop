import React from 'react';
import { render } from 'react-dom';
import { _setBackgroundConnection } from '../../submodules/extension/ui/store/action-queue';
import { IPCMainStream } from '../app/ipc-main-stream';
import metaRPCClientFactory from '../../submodules/extension/app/scripts/lib/metaRPCClientFactory';
import * as extensionActions from '../../submodules/extension/ui/store/actions';
import registerUpdateOSTheme from '../ui/hooks/registerUpdateOSTheme';
import setTheme from '../ui/helpers/theme';
import * as actions from './actions';
import configureStore from './store/store';
import Root from './pages';

async function launchPopupUi() {
  const { store } = configureStore();

  window.popupElectronBridge.onShow(async () => {
    await extensionActions.forceUpdateMetamaskState(store.dispatch);
  });

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', registerUpdateOSTheme(store));

  window.popupElectronBridge.onThemeChanged((theme) => {
    setTheme(theme);
  });

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

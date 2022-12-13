import React from 'react';
import { render } from 'react-dom';

import configureStore from './store/store';
import Root from './pages';
import registerUpdatePairStatus from './hooks/registerUpdatePairStatus';
import registerUpdateOSTheme from './hooks/registerUpdateOSTheme';

async function launchDesktopUi() {
  const { store, persistor } = configureStore();

  // Register listener OS theme change
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', registerUpdateOSTheme(store));

  window.electron.onStatusChange(registerUpdatePairStatus(store));

  render(
    <Root store={store} persistor={persistor} />,
    document.getElementById('mmd-root'),
  );
}

export default launchDesktopUi;

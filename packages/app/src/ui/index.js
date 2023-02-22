import React from 'react';
import { render } from 'react-dom';
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

  render(
    <Root store={store} persistor={persistor} />,
    document.getElementById('mmd-root'),
  );
}

export default launchDesktopUi;

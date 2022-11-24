import './globals';
import log from 'loglevel';
import { DesktopState, RemotePort } from '@metamask/desktop/dist/types';
import {
  loadStateFromPersistence,
  setupController,
} from '../../submodules/extension/app/scripts/background';
import cfg from '../utils/config';
import DesktopApp from './desktop-app';

/**
 * TODO
 * Gets user the preferred language code.
 *
 * @returns The laguange code to be used for the app localisation. Defaults to 'en'.
 */
const getFirstPreferredLangCode = () => {
  return 'en';
};

/**
 * Transfers desktop state to the extension.
 *
 * @param state - App state.
 * @param state.DesktopController - Specific desktop controller state.
 */
const transferStateCb = (state: {
  DesktopController: DesktopState;
  [otherOptions: string]: unknown;
}) => {
  DesktopApp.getConnection()?.transferState({ data: state });
};

const getPortStream = (remotePort: RemotePort) => {
  return remotePort.stream;
};

const getOrigin = () => {
  return 'DESKTOP_APP';
};

/**
 * Register Desktop App specific extension connect listeners.
 *
 * @param connectRemote - A remotePort object for internal connections.
 * @param connectExternal - A remotePort object for external connections.
 */
const registerConnectListeners = (
  connectRemote: (remotePort: RemotePort) => void,
  connectExternal: (remotePort: RemotePort) => void,
) => {
  DesktopApp.on('connect-remote', (connectRequest) => {
    connectRemote(connectRequest);
  });

  DesktopApp.on('connect-external', (connectRequest) => {
    connectExternal(connectRequest);
  });
};

/**
 * Initialize the wallet logic.
 */
const initialize = async () => {
  const initState = await loadStateFromPersistence();
  const initLangCode = await getFirstPreferredLangCode();

  await setupController(initState, initLangCode, '', {
    transferStateCb,
    registerConnectListeners,
    getPortStream,
    getOrigin,
  });

  log.info('MetaMask initialization complete.');
};

/**
 * Sets desktop listeners to re initialize the wallet logic
 * whenever the desktop app is restarted.
 *
 * @param desktopApp - Desktop app singleton.
 */
const onDesktopRestart = async (desktopApp: typeof DesktopApp) => {
  if (cfg().isExtensionTest) {
    return;
  }

  desktopApp.removeAllListeners();
  desktopApp.on('restart', () => onDesktopRestart(desktopApp));

  log.debug('Re-initializing background script');
  await initialize();
};

/**
 * Initialize desktop app.
 */
const initDesktopApp = async () => {
  await DesktopApp.init();
  DesktopApp.on('restart', () => onDesktopRestart(DesktopApp));
};

initDesktopApp().then(initialize).catch(log.error);

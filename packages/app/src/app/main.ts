import './globals';
import './controller-init';
import log from 'loglevel';
import { RawState, RemotePort } from '@metamask/desktop/dist/types';
import {
  loadStateFromPersistence,
  setupController,
  statePersistenceEvents,
} from '../../submodules/extension/app/scripts/background';
import cfg from '../utils/config';
import { LedgerBridgeKeyring as LedgerKeyring } from '../hw/ledger/ledger-keyring';
import TrezorKeyring from '../hw/trezor/trezor-keyring';
import LatticeKeyring from '../hw/lattice/lattice-keyring';
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
 * Register listener that will transfer desktop state to the extension whenever state gets persisted.
 */
const registerStatePersistenceListener = () => {
  statePersistenceEvents.on('state-persisted', (state: RawState['data']) => {
    DesktopApp.getConnection()?.transferState({ data: state });
  });
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
  registerStatePersistenceListener();

  await setupController(initState, initLangCode, '', {
    registerConnectListeners,
    getPortStream,
    getOrigin,
    keyrings: {
      trezor: TrezorKeyring,
      ledger: LedgerKeyring,
      lattice: LatticeKeyring,
    },
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

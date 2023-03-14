import './globals';
import './controller-init';
import log from 'loglevel';
import { RawState, RemotePort } from '@metamask/desktop/dist/types';
import { NodeThreadExecutionService } from '@metamask/snaps-controllers';
import {
  loadStateFromPersistence,
  setupController,
  statePersistenceEvents,
} from '../../submodules/extension/app/scripts/background';
import cfg from './utils/config';
import { LedgerBridgeKeyring as LedgerKeyring } from './hw/ledger/ledger-keyring';
import TrezorKeyring from './hw/trezor/trezor-keyring';
import LatticeKeyring from './hw/lattice/lattice-keyring';
import DesktopApp from './desktop-app';
import metricsService from './metrics/metrics-service';
import { EVENT_NAMES } from './metrics/metrics-constants';

const onExtensionBackgroundMessage = (data: any) => {
  if (data.data?.method === 'markNotificationPopupAsAutomaticallyClosed') {
    DesktopApp.hideApprovalWindow();
  }
};

/**
 * TODO
 * Gets user the preferred language code.
 *
 * @returns The language code to be used for the app localisation. Defaults to 'en'.
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
  remotePort.stream.on('data', (data) => onExtensionBackgroundMessage(data));

  return remotePort.stream;
};

const getOrigin = () => {
  return 'DESKTOP_APP';
};

const createSnapExecutionService = (args: any) => {
  return new NodeThreadExecutionService(args);
};

/**
 * Register Desktop App specific extension connect listeners.
 *
 * @param isDesktopPopupEnabled - Whether the desktop popup is enabled.
 * @returns A function that registers the listeners.
 */
const registerConnectListeners =
  (isDesktopPopupEnabled: boolean) =>
  (
    connectRemote: (remotePort: RemotePort) => void,
    connectExternal: (remotePort: RemotePort) => void,
  ) => {
    DesktopApp.on('connect-remote', (connectRequest) => {
      connectRemote(connectRequest);
    });

    DesktopApp.on('connect-external', (connectRequest) => {
      connectExternal(connectRequest);
    });

    if (cfg().enableDesktopPopup && isDesktopPopupEnabled) {
      connectRemote({
        stream: DesktopApp.approvalStream,
        name: 'popup',
        sender: {
          id: 'egblhinadgaeepccffjicmccokcoddni',
          url: 'chrome-extension://egblhinadgaeepccffjicmccokcoddni/popup.html',
          origin: 'chrome-extension://egblhinadgaeepccffjicmccokcoddni',
        },
      } as any);

      log.info('Created background connection for approval window');
    }
  };

/**
 * Initialize the wallet logic.
 *
 * @param options - Options bag.
 * @param options.isDesktopPopupEnabled - Whether the desktop popup is enabled.
 */
const initialize = async ({
  isDesktopPopupEnabled,
}: {
  isDesktopPopupEnabled: boolean;
}) => {
  const initState = await loadStateFromPersistence();
  const initLangCode = await getFirstPreferredLangCode();
  registerStatePersistenceListener();

  await setupController(initState, initLangCode, {
    registerConnectListeners: registerConnectListeners(isDesktopPopupEnabled),
    getPortStream,
    getOrigin,
    createSnapExecutionService,
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

  const isDesktopPopupEnabled = DesktopApp.isDesktopPopupEnabled();

  desktopApp.removeAllListeners();
  desktopApp.on('restart', () => onDesktopRestart(desktopApp));

  log.debug('Re-initializing background script');
  await initialize({ isDesktopPopupEnabled });
};

/**
 * Initialize desktop app.
 */
const initDesktopApp = async () => {
  metricsService.track(EVENT_NAMES.DESKTOP_APP_STARTING);
  const { isDesktopPopupEnabled } = await DesktopApp.init();
  DesktopApp.on('restart', () => onDesktopRestart(DesktopApp));
  return { isDesktopPopupEnabled };
};

initDesktopApp().then(initialize).catch(log.error);

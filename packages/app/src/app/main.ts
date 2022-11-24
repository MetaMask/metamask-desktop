/* eslint-disable @typescript-eslint/no-shadow */
import './globals';
import log from 'loglevel';
import { DesktopState, RemotePort } from '@metamask/desktop/dist/types';
import {
  loadStateFromPersistence,
  MetaMaskState,
  notificationManager,
  localStore,
  platform,
} from '../../submodules/extension/app/scripts/background';
import SetupController from '../../submodules/extension/app/scripts/setup-controller';
import cfg from '../utils/config';
import NotificationManager from '../../submodules/extension/app/scripts/lib/notification-manager';
import LocalStore from '../../submodules/extension/app/scripts/lib/local-store';
import ReadOnlyNetworkStore from '../../submodules/extension/app/scripts/lib/network-store';
import ExtensionPlatform from '../../submodules/extension/app/scripts/platforms/extension';
import DesktopApp from './desktop-app';

interface SetupDestkopAppConstructorType {
  initState: MetaMaskState;
  initLangCode: string;
  notificationManager: NotificationManager;
  localStore: ReadOnlyNetworkStore | LocalStore;
  platform: ExtensionPlatform;
  overrideCallbacks: any;
}

class SetupDesktopAppControllers extends SetupController {
  private transferStateCb;

  private registerConnectListeners;

  constructor({
    initState,
    initLangCode,
    notificationManager,
    localStore,
    platform,
    overrideCallbacks,
  }: SetupDestkopAppConstructorType) {
    super({
      initState,
      initLangCode,
      notificationManager,
      remoteSourcePort: undefined,
      localStore,
      platform,
    });

    this.transferStateCb = overrideCallbacks.transferStateCb;
    this.registerConnectListeners = overrideCallbacks.registerConnectListeners;
  }

  async init() {
    this.persistStorage();
    this.setupSentryGetStateGlobal();
    this.initUserInterfaceSetup();
    this.registerDesktopListeners();
    return Promise.resolve();
  }

  getPortStream(remotePort: any) {
    return remotePort.stream;
  }

  registerStatePersistenceListener() {
    this.statePersistenceEventEmmitter.on('StatePersisted', (state) => {
      this.transferStateCb(state);
    });
  }

  registerDesktopListeners() {
    this.registerConnectListeners(this.connectRemote, this.connectExternal);
  }
}

/**
 * TODO
 * Gets user the preferred language code.
 *
 * @returns The laguange code to be used for the app localisation. Defaults to 'en'.
 */
function getFirstPreferredLangCode() {
  return 'en';
}

/**
 * Transfers desktop state to the extension.
 *
 * @param state - App state.
 * @param state.DesktopController - Specific desktop controller state.
 */
async function transferStateCb(state: {
  DesktopController: DesktopState;
  [otherOptions: string]: unknown;
}) {
  DesktopApp.getConnection()?.transferState({ data: state });
}

/**
 * Register Desktop App specific extension connect listeners.
 *
 * @param connectRemote - A remotePort object for internal connections.
 * @param connectExternal - A remotePort object for external connections.
 */
function registerConnectListeners(
  connectRemote: (remotePort: RemotePort) => void,
  connectExternal: (remotePort: RemotePort) => void,
) {
  DesktopApp.on('connect-remote', (connectRequest) => {
    connectRemote(connectRequest);
  });

  DesktopApp.on('connect-external', (connectRequest) => {
    connectExternal(connectRequest);
  });
}

/**
 * Initialize the wallet logic.
 */
async function initialize() {
  const initState = await loadStateFromPersistence();
  const initLangCode = await getFirstPreferredLangCode();

  const setupControllerInstance = new SetupDesktopAppControllers({
    initState,
    initLangCode,
    notificationManager,
    localStore,
    platform,
    overrideCallbacks: {
      transferStateCb,
      registerConnectListeners,
    },
  });

  await setupControllerInstance.init();

  log.info('MetaMask initialization complete.');
}

const onDesktopRestart = async (desktopApp: typeof DesktopApp) => {
  if (cfg().isExtensionTest) {
    return;
  }

  desktopApp.removeAllListeners();
  desktopApp.on('restart', () => onDesktopRestart(desktopApp));

  log.debug('Re-initializing background script');
  await initialize();
};

const initDesktopApp = async () => {
  await DesktopApp.init();
  DesktopApp.on('restart', () => onDesktopRestart(DesktopApp));
};

initDesktopApp().then(initialize).catch(log.error);

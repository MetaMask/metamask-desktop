/**
 * @file The entry point for the web extension singleton process.
 */

///: BEGIN:EXCLUDE_IN(desktopapp)
import './browser-init';
///: END:EXCLUDE_IN
import EventEmitter from 'events';
import endOfStream from 'end-of-stream';
import pump from 'pump';
import debounce from 'debounce-stream';
import log from 'loglevel';
import { storeAsStream } from '@metamask/obs-store';
import PortStream from 'extension-port-stream';

import { ethErrors } from 'eth-rpc-errors';
import { browser } from '@metamask/desktop/dist/browser';
///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
import {
  CONNECTION_TYPE_EXTERNAL,
  CONNECTION_TYPE_INTERNAL,
} from '@metamask/desktop/dist/constants';
///: END:ONLY_INCLUDE_IN
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_FIREFOX,
} from '../../shared/constants/app';
import { SECOND } from '../../shared/constants/time';
import {
  REJECT_NOTFICIATION_CLOSE,
  REJECT_NOTFICIATION_CLOSE_SIG,
  EVENT,
  EVENT_NAMES,
  TRAITS,
} from '../../shared/constants/metametrics';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { maskObject } from '../../shared/modules/object.utils';
import migrations from './migrations';
import Migrator from './lib/migrator';
import ExtensionPlatform from './platforms/extension';
import LocalStore from './lib/local-store';
import ReadOnlyNetworkStore from './lib/network-store';
import { SENTRY_STATE } from './lib/setupSentry';

import createStreamSink from './lib/createStreamSink';
import NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS,
} from './lib/notification-manager';
import MetamaskController, {
  METAMASK_CONTROLLER_EVENTS,
} from './metamask-controller';
import rawFirstTimeState from './first-time-state';
import getFirstPreferredLangCode from './lib/get-first-preferred-lang-code';
import getObjStructure from './lib/getObjStructure';
import setupEnsIpfsResolver from './lib/ens-ipfs/setup';
import { getPlatform } from './lib/util';

/* eslint-disable import/order */
///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
import DesktopManager from '../../../../src/extension/desktop-manager';
///: END:ONLY_INCLUDE_IN
/* eslint-enable import/order */

const { sentry } = global;
const firstTimeState = { ...rawFirstTimeState };

const metamaskInternalProcessHash = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
};

const metamaskBlockedPorts = ['trezor-connect'];

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'info');

const platform = new ExtensionPlatform();

const notificationManager = new NotificationManager();
global.METAMASK_NOTIFIER = notificationManager;

let popupIsOpen = false;
let notificationIsOpen = false;
let uiIsTriggering = false;
const openMetamaskTabsIDs = {};
const requestAccountTabIds = {};
let controller;

// state persistence
const inTest = process.env.IN_TEST;
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
let versionedData;

if (inTest || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = localStore.get.bind(localStore);
}

const phishingPageUrl = new URL(
  process.env.PHISHING_WARNING_PAGE_URL || 'http://test.com',
);

const ONE_SECOND_IN_MILLISECONDS = 1_000;
// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

const ACK_KEEP_ALIVE_MESSAGE = 'ACK_KEEP_ALIVE_MESSAGE';
const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE';

///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
const overrideCallbacksValidOrigins = {
  EXTENSION: 'EXTENSION',
  DESKTOP: 'DESKTOP_APP',
};
///: END:ONLY_INCLUDE_IN

// Event emitter for state persistence
export const statePersistenceEvents = new EventEmitter();

/**
 * In case of MV3 we attach a "onConnect" event listener as soon as the application is initialised.
 * Reason is that in case of MV3 a delay in doing this was resulting in missing first connect event after service worker is re-activated.
 */

const initApp = async (remotePort) => {
  browser.runtime.onConnect.removeListener(initApp);
  await initialize(remotePort);
  log.info('MetaMask initialization complete.');
};

/**
 * @typedef {import('../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

/**
 * The data emitted from the MetaMaskController.store EventEmitter, also used to initialize the MetaMaskController. Available in UI on React state as state.metamask.
 *
 * @typedef MetaMaskState
 * @property {boolean} isInitialized - Whether the first vault has been created.
 * @property {boolean} isUnlocked - Whether the vault is currently decrypted and accounts are available for selection.
 * @property {boolean} isAccountMenuOpen - Represents whether the main account selection UI is currently displayed.
 * @property {object} identities - An object matching lower-case hex addresses to Identity objects with "address" and "name" (nickname) keys.
 * @property {object} unapprovedTxs - An object mapping transaction hashes to unapproved transactions.
 * @property {Array} frequentRpcList - A list of frequently used RPCs, including custom user-provided ones.
 * @property {Array} addressBook - A list of previously sent to addresses.
 * @property {object} contractExchangeRates - Info about current token prices.
 * @property {Array} tokens - Tokens held by the current user, including their balances.
 * @property {object} send - TODO: Document
 * @property {boolean} useBlockie - Indicates preferred user identicon format. True for blockie, false for Jazzicon.
 * @property {object} featureFlags - An object for optional feature flags.
 * @property {boolean} welcomeScreen - True if welcome screen should be shown.
 * @property {string} currentLocale - A locale string matching the user's preferred display language.
 * @property {object} provider - The current selected network provider.
 * @property {string} provider.rpcUrl - The address for the RPC API, if using an RPC API.
 * @property {string} provider.type - An identifier for the type of network selected, allows MetaMask to use custom provider strategies for known networks.
 * @property {string} network - A stringified number of the current network ID.
 * @property {object} accounts - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values.
 * @property {hex} currentBlockGasLimit - The most recently seen block gas limit, in a lower case hex prefixed string.
 * @property {TransactionMeta[]} currentNetworkTxList - An array of transactions associated with the currently selected network.
 * @property {object} unapprovedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedMsgCount - The number of messages in unapprovedMsgs.
 * @property {object} unapprovedPersonalMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedPersonalMsgCount - The number of messages in unapprovedPersonalMsgs.
 * @property {object} unapprovedEncryptionPublicKeyMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedEncryptionPublicKeyMsgCount - The number of messages in EncryptionPublicKeyMsgs.
 * @property {object} unapprovedDecryptMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedDecryptMsgCount - The number of messages in unapprovedDecryptMsgs.
 * @property {object} unapprovedTypedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedTypedMsgCount - The number of messages in unapprovedTypedMsgs.
 * @property {number} pendingApprovalCount - The number of pending request in the approval controller.
 * @property {string[]} keyringTypes - An array of unique keyring identifying strings, representing available strategies for creating accounts.
 * @property {Keyring[]} keyrings - An array of keyring descriptions, summarizing the accounts that are available for use, and what keyrings they belong to.
 * @property {string} selectedAddress - A lower case hex string of the currently selected address.
 * @property {string} currentCurrency - A string identifying the user's preferred display currency, for use in showing conversion rates.
 * @property {number} conversionRate - A number representing the current exchange rate from the user's preferred currency to Ether.
 * @property {number} conversionDate - A unix epoch date (ms) for the time the current conversion rate was last retrieved.
 * @property {boolean} forgottenPassword - Returns true if the user has initiated the password recovery screen, is recovering from seed phrase.
 */

/**
 * @typedef VersionedData
 * @property {MetaMaskState} data - The data emitted from MetaMask controller, or used to initialize it.
 * @property {number} version - The latest migration version that has been run.
 */

/**
 * Initializes the MetaMask controller, and sets up all platform configuration.
 *
 * @param {string} remotePort - remote application port connecting to extension.
 * @returns {Promise} Setup complete.
 */
async function initialize(remotePort) {
  const initState = await loadStateFromPersistence();
  const initLangCode = await getFirstPreferredLangCode();

  ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
  await DesktopManager.init(initState);
  ///: END:ONLY_INCLUDE_IN

  await setupController(initState, initLangCode, remotePort);

  if (!isManifestV3) {
    await loadPhishingWarningPage();
  }

  log.info('MetaMask initialization complete.');
}

/**
 * An error thrown if the phishing warning page takes too long to load.
 */
class PhishingWarningPageTimeoutError extends Error {
  constructor() {
    super('Timeout failed');
  }
}

/**
 * Load the phishing warning page temporarily to ensure the service
 * worker has been registered, so that the warning page works offline.
 */
// eslint-disable-next-line no-unused-vars
async function loadPhishingWarningPage() {
  let iframe;
  try {
    const extensionStartupPhishingPageUrl = new URL(
      process.env.PHISHING_WARNING_PAGE_URL,
    );
    // The `extensionStartup` hash signals to the phishing warning page that it should not bother
    // setting up streams for user interaction. Otherwise this page load would cause a console
    // error.
    extensionStartupPhishingPageUrl.hash = '#extensionStartup';

    iframe = window.document.createElement('iframe');
    iframe.setAttribute('src', extensionStartupPhishingPageUrl.href);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    // Create "deferred Promise" to allow passing resolve/reject to event handlers
    let deferredResolve;
    let deferredReject;
    const loadComplete = new Promise((resolve, reject) => {
      deferredResolve = resolve;
      deferredReject = reject;
    });

    // The load event is emitted once loading has completed, even if the loading failed.
    // If loading failed we can't do anything about it, so we don't need to check.
    iframe.addEventListener('load', deferredResolve);

    // This step initiates the page loading.
    window.document.body.appendChild(iframe);

    // This timeout ensures that this iframe gets cleaned up in a reasonable
    // timeframe, and ensures that the "initialization complete" message
    // doesn't get delayed too long.
    setTimeout(
      () => deferredReject(new PhishingWarningPageTimeoutError()),
      PHISHING_WARNING_PAGE_TIMEOUT,
    );
    await loadComplete;
  } catch (error) {
    if (error instanceof PhishingWarningPageTimeoutError) {
      console.warn(
        'Phishing warning page timeout; page not guaraneteed to work offline.',
      );
    } else {
      console.error('Failed to initialize phishing warning page', error);
    }
  } finally {
    if (iframe) {
      iframe.remove();
    }
  }
}

//
// State and Persistence
//

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 *
 * @returns {Promise<MetaMaskState>} Last data emitted from previous instance of MetaMask.
 */
export async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({ migrations });
  migrator.on('error', console.warn);

  // read from disk
  // first from preferred, async API:
  versionedData =
    (await localStore.get()) || migrator.generateInitialState(firstTimeState);

  // check if somehow state is empty
  // this should never happen but new error reporting suggests that it has
  // for a small number of users
  // https://github.com/metamask/metamask-extension/issues/3919
  if (versionedData && !versionedData.data) {
    // unable to recover, clear state
    versionedData = migrator.generateInitialState(firstTimeState);
    sentry.captureMessage('MetaMask - Empty vault found - unable to recover');
  }

  // report migration errors to sentry
  migrator.on('error', (err) => {
    // get vault structure without secrets
    const vaultStructure = getObjStructure(versionedData);
    sentry.captureException(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    });
  });

  // migrate data
  versionedData = await migrator.migrateData(versionedData);
  if (!versionedData) {
    throw new Error('MetaMask - migrator returned undefined');
  }
  // this initializes the meta/version data as a class variable to be used for future writes
  localStore.setMetadata(versionedData.meta);

  // write to disk
  localStore.set(versionedData.data);

  // return just the data
  return versionedData.data;
}

/**
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 * @param {string} remoteSourcePort - remote application port connecting to extension.
 * @param {object} overrides - object with callbacks that are allowed to override the setup controller logic (usefull for desktop app)
 */
export function setupController(
  initState,
  initLangCode,
  remoteSourcePort,
  overrides,
) {
  //
  // MetaMask Controller
  //

  controller = new MetamaskController({
    infuraProjectId: process.env.INFURA_PROJECT_ID,
    // User confirmation callbacks:
    showUserConfirmation: triggerUi,
    openPopup,
    // initial state
    initState,
    // initial locale code
    initLangCode,
    // platform specific api
    platform,
    notificationManager,
    browser,
    getRequestAccountTabIds: () => {
      return requestAccountTabIds;
    },
    getOpenMetamaskTabsIds: () => {
      return openMetamaskTabsIDs;
    },
    localStore,
  });

  setupEnsIpfsResolver({
    getCurrentChainId: controller.networkController.getCurrentChainId.bind(
      controller.networkController,
    ),
    getIpfsGateway: controller.preferencesController.getIpfsGateway.bind(
      controller.preferencesController,
    ),
    provider: controller.provider,
  });

  // setup state persistence
  pump(
    storeAsStream(controller.store),
    debounce(1000),
    createStreamSink(async (state) => {
      await localStore.set(state);
      statePersistenceEvents.emit('state-persisted', state);
    }),
    (error) => {
      log.error('MetaMask - Persistence pipeline failed', error);
    },
  );

  setupSentryGetStateGlobal(controller);

  //
  // connect to other contexts
  //
  if (isManifestV3 && remoteSourcePort) {
    connectRemote(remoteSourcePort);
  }

  if (overrides?.registerConnectListeners) {
    overrides.registerConnectListeners(connectRemote, connectExternal);
  } else {
    browser.runtime.onConnect.addListener(connectRemote);
    browser.runtime.onConnectExternal.addListener(connectExternal);
  }

  const isClientOpenStatus = () => {
    return (
      popupIsOpen ||
      Boolean(Object.keys(openMetamaskTabsIDs).length) ||
      notificationIsOpen
    );
  };

  const onCloseEnvironmentInstances = (isClientOpen, environmentType) => {
    // if all instances of metamask are closed we call a method on the controller to stop gasFeeController polling
    if (isClientOpen === false) {
      controller.onClientClosed();
      // otherwise we want to only remove the polling tokens for the environment type that has closed
    } else {
      // in the case of fullscreen environment a user might have multiple tabs open so we don't want to disconnect all of
      // its corresponding polling tokens unless all tabs are closed.
      if (
        environmentType === ENVIRONMENT_TYPE_FULLSCREEN &&
        Boolean(Object.keys(openMetamaskTabsIDs).length)
      ) {
        return;
      }
      controller.onEnvironmentTypeClosed(environmentType);
    }
  };

  /**
   * A runtime.Port object, as provided by the browser:
   *
   * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */

  /**
   * Connects a Port to the MetaMask controller via a multiplexed duplex stream.
   * This method identifies trusted (MetaMask) interfaces, and connects them differently from untrusted (web pages).
   *
   * @param {Port} remotePort - The port provided by a new context.
   */
  function connectRemote(remotePort) {
    ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
    if (
      DesktopManager.isDesktopEnabled() &&
      overrideCallbacksValidOrigins.DESKTOP !== overrides?.getOrigin?.()
    ) {
      DesktopManager.createStream(remotePort, CONNECTION_TYPE_INTERNAL).then(
        () => {
          // When in Desktop Mode the responsibility to send CONNECTION_READY is on the desktop app side
          if (isManifestV3) {
            // Message below if captured by UI code in app/scripts/ui.js which will trigger UI initialisation
            // This ensures that UI is initialised only after background is ready
            // It fixes the issue of blank screen coming when extension is loaded, the issue is very frequent in MV3
            remotePort.postMessage({ name: 'CONNECTION_READY' });
          }
        },
      );
      return;
    }
    ///: END:ONLY_INCLUDE_IN

    const processName = remotePort.name;

    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    let isMetaMaskInternalProcess = false;
    const sourcePlatform = getPlatform();

    if (sourcePlatform === PLATFORM_FIREFOX) {
      isMetaMaskInternalProcess = metamaskInternalProcessHash[processName];
    } else {
      isMetaMaskInternalProcess =
        remotePort.sender.origin === `chrome-extension://${browser.runtime.id}`;
    }

    const senderUrl = remotePort.sender?.url
      ? new URL(remotePort.sender.url)
      : null;

    if (isMetaMaskInternalProcess) {
      const portStream =
        overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);

      // communication with popup
      controller.isClientOpen = true;
      controller.setupTrustedCommunication(portStream, remotePort.sender);

      if (isManifestV3) {
        // Message below if captured by UI code in app/scripts/ui.js which will trigger UI initialisation
        // This ensures that UI is initialised only after background is ready
        // It fixes the issue of blank screen coming when extension is loaded, the issue is very frequent in MV3
        remotePort.postMessage({ name: 'CONNECTION_READY' });

        // If we get a WORKER_KEEP_ALIVE message, we respond with an ACK
        remotePort.onMessage.addListener((message) => {
          if (message.name === WORKER_KEEP_ALIVE_MESSAGE) {
            // To test un-comment this line and wait for 1 minute. An error should be shown on MetaMask UI.
            remotePort.postMessage({ name: ACK_KEEP_ALIVE_MESSAGE });
          }
        });
      }

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        popupIsOpen = true;
        endOfStream(portStream, () => {
          popupIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        endOfStream(portStream, () => {
          notificationIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_NOTIFICATION,
          );
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        openMetamaskTabsIDs[tabId] = true;

        endOfStream(portStream, () => {
          delete openMetamaskTabsIDs[tabId];
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_FULLSCREEN,
          );
        });
      }
    } else if (
      senderUrl &&
      senderUrl.origin === phishingPageUrl.origin &&
      senderUrl.pathname === phishingPageUrl.pathname
    ) {
      const portStream =
        overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);

      controller.setupPhishingCommunication({
        connectionStream: portStream,
      });
    } else {
      if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
        const tabId = remotePort.sender.tab.id;
        const url = new URL(remotePort.sender.url);
        const { origin } = url;

        remotePort.onMessage.addListener((msg) => {
          if (msg.data && msg.data.method === 'eth_requestAccounts') {
            requestAccountTabIds[origin] = tabId;
          }
        });
      }
      connectExternal(remotePort);
    }
  }

  // communication with page or other extension
  function connectExternal(remotePort) {
    ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
    if (
      DesktopManager.isDesktopEnabled() &&
      overrideCallbacksValidOrigins.DESKTOP !== overrides?.getOrigin?.()
    ) {
      DesktopManager.createStream(remotePort, CONNECTION_TYPE_EXTERNAL);
      return;
    }
    ///: END:ONLY_INCLUDE_IN

    const portStream =
      overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);

    controller.setupUntrustedCommunication({
      connectionStream: portStream,
      sender: remotePort.sender,
    });
  }

  //
  // User Interface setup
  //

  updateBadge();
  controller.txController.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.messageManager.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.personalMessageManager.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.decryptMessageManager.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.encryptionPublicKeyManager.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.typedMessageManager.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.appStateController.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.APPROVAL_STATE_CHANGE,
    updateBadge,
  );

  /**
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * The number reflects the current number of pending transactions or message signatures needing user approval.
   */
  function updateBadge() {
    let label = '';
    const count = getUnapprovedTransactionCount();
    if (count) {
      label = String(count);
    }
    // browserAction has been replaced by action in MV3
    if (isManifestV3) {
      browser.action.setBadgeText({ text: label });
      browser.action.setBadgeBackgroundColor({ color: '#037DD6' });
    } else {
      browser.browserAction.setBadgeText({ text: label });
      browser.browserAction.setBadgeBackgroundColor({ color: '#037DD6' });
    }
  }

  function getUnapprovedTransactionCount() {
    const unapprovedTxCount = controller.txController.getUnapprovedTxCount();
    const { unapprovedMsgCount } = controller.messageManager;
    const { unapprovedPersonalMsgCount } = controller.personalMessageManager;
    const { unapprovedDecryptMsgCount } = controller.decryptMessageManager;
    const { unapprovedEncryptionPublicKeyMsgCount } =
      controller.encryptionPublicKeyManager;
    const { unapprovedTypedMessagesCount } = controller.typedMessageManager;
    const pendingApprovalCount =
      controller.approvalController.getTotalApprovalCount();
    const waitingForUnlockCount =
      controller.appStateController.waitingForUnlock.length;
    return (
      unapprovedTxCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount +
      unapprovedTypedMessagesCount +
      pendingApprovalCount +
      waitingForUnlockCount
    );
  }

  notificationManager.on(
    NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
    ({ automaticallyClosed }) => {
      if (!automaticallyClosed) {
        rejectUnapprovedNotifications();
      } else if (getUnapprovedTransactionCount() > 0) {
        triggerUi();
      }
    },
  );

  function rejectUnapprovedNotifications() {
    Object.keys(
      controller.txController.txStateManager.getUnapprovedTxList(),
    ).forEach((txId) =>
      controller.txController.txStateManager.setTxStatusRejected(txId),
    );
    controller.messageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        controller.messageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    controller.personalMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        controller.personalMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    controller.typedMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        controller.typedMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE_SIG,
        ),
      );
    controller.decryptMessageManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        controller.decryptMessageManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE,
        ),
      );
    controller.encryptionPublicKeyManager.messages
      .filter((msg) => msg.status === 'unapproved')
      .forEach((tx) =>
        controller.encryptionPublicKeyManager.rejectMsg(
          tx.id,
          REJECT_NOTFICIATION_CLOSE,
        ),
      );

    // Finally, reject all approvals managed by the ApprovalController
    controller.approvalController.clear(
      ethErrors.provider.userRejectedRequest(),
    );

    updateBadge();
  }

  ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
  if (overrideCallbacksValidOrigins.DESKTOP !== overrides?.getOrigin?.()) {
    controller.store.subscribe((state) => {
      DesktopManager.setState(state);
    });
  }
  ///: END:ONLY_INCLUDE_IN

  return Promise.resolve();
}

//
// Etc...
//

/**
 * Opens the browser popup for user confirmation
 */
async function triggerUi() {
  const tabs = await platform.getActiveTabs();
  const currentlyActiveMetamaskTab = Boolean(
    tabs.find((tab) => openMetamaskTabsIDs[tab.id]),
  );
  // Vivaldi is not closing port connection on popup close, so popupIsOpen does not work correctly
  // To be reviewed in the future if this behaviour is fixed - also the way we determine isVivaldi variable might change at some point
  const isVivaldi =
    tabs.length > 0 &&
    tabs[0].extData &&
    tabs[0].extData.indexOf('vivaldi_tab') > -1;
  if (
    !uiIsTriggering &&
    (isVivaldi || !popupIsOpen) &&
    !currentlyActiveMetamaskTab
  ) {
    uiIsTriggering = true;
    try {
      await notificationManager.showPopup();
    } finally {
      uiIsTriggering = false;
    }
  }
}

/**
 * Opens the browser popup for user confirmation of watchAsset
 * then it waits until user interact with the UI
 */
async function openPopup() {
  await triggerUi();
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!notificationIsOpen) {
        clearInterval(interval);
        resolve();
      }
    }, SECOND);
  });
}

// It adds the "App Installed" event into a queue of events, which will be tracked only after a user opts into metrics.
const addAppInstalledEvent = () => {
  if (controller) {
    controller.metaMetricsController.updateTraits({
      [TRAITS.INSTALL_DATE_EXT]: new Date().toISOString().split('T')[0], // yyyy-mm-dd
    });
    controller.metaMetricsController.addEventBeforeMetricsOptIn({
      category: EVENT.CATEGORIES.APP,
      event: EVENT_NAMES.APP_INSTALLED,
      properties: {},
    });
    return;
  }
  setTimeout(() => {
    // If the controller is not set yet, we wait and try to add the "App Installed" event again.
    addAppInstalledEvent();
  }, 1000);
};

function initBackground() {
  if (isManifestV3) {
    browser.runtime.onConnect.addListener(initApp);
  } else {
    initialize().catch(log.error);
  }

  // On first install, open a new tab with MetaMask
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (
      reason === 'install' &&
      !(process.env.METAMASK_DEBUG || process.env.IN_TEST)
    ) {
      addAppInstalledEvent();
      platform.openExtensionInBrowser();
    }
  });
}

function setupSentryGetStateGlobal(store) {
  global.stateHooks.getSentryState = function () {
    const fullState = store.getState();
    const debugState = maskObject({ metamask: fullState }, SENTRY_STATE);
    return {
      browser: window.navigator.userAgent,
      store: debugState,
      version: platform.getVersion(),
    };
  };
}

if (!process.env.SKIP_BACKGROUND_INITIALIZATION) {
  initBackground();
}

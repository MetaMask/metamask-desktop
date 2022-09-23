import log from 'loglevel';
import ObfuscatedStore from './storage';
import { Browser } from './types/browser';

const warn = (name: string) => {
  log.debug(`Browser method not supported - ${name}`);
};

const reject = (name: string) => {
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject(`Browser method not supported - ${name}`);
};

const browser: Browser = {
  windows: {
    getLastFocused: () => reject('windows.getLastFocused'),
    getCurrent: () => reject('windows.getCurrent'),
    getAll: () => reject('windows.getAll'),
    create: () => reject('windows.create'),
    update: () => reject('windows.update'),
    remove: () => reject('windows.remove'),
    onRemoved: {
      addListener: () => warn('windows.onRemoved.addListener'),
    },
  },
  browserAction: {
    setBadgeText: () => warn('browserAction.setBadgeText'),
    setBadgeBackgroundColor: () =>
      warn('browserAction.setBadgeBackgroundColor'),
  },
  action: {
    setBadgeText: () => warn('action.setBadgeText'),
    setBadgeBackgroundColor: () => warn('action.setBadgeBackgroundColor'),
  },
  storage: {
    local: {
      get: () => ObfuscatedStore.getStore(),
      set: async (data: any) => {
        await ObfuscatedStore.setStore(data);
      },
    },
  },
  runtime: {
    id: '1234',
    lastError: undefined,
    getManifest: () => ({
      manifest_version: 2,
      version: '103.0.5060.134',
    }),
    getPlatformInfo: () => Promise.resolve({ os: 'mac' }),
    setUninstallURL: () => warn('runtime.setUninstallURL'),
    onInstalled: {
      addListener: () => warn('runtime.onInstalled.addListener'),
    },
    onMessageExternal: {
      addListener: () => warn('runtime.onMessageExternal.addListener'),
    },
    onConnect: {
      addListener: () => warn('runtime.onConnect.addListener'),
    },
    onConnectExternal: {
      addListener: () => warn('runtime.onConnectExternal.addListener'),
    },
  },
  webRequest: {
    onErrorOccurred: {
      addListener: () => warn('webRequest.onErrorOccurred.addListener'),
    },
  },
} as unknown as Browser;

export default browser;

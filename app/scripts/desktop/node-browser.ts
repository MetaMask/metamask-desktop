import log from 'loglevel';
import ObfuscatedStore from './storage';
import { Browser } from './types/browser';

const _warn = (name: string) => {
  log.debug(`Browser method not supported - ${name}`);
};

const _reject = (name: string) => {
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject(`Browser method not supported - ${name}`);
};

const browser: Browser = {
  windows: {
    getLastFocused: () => _reject('windows.getLastFocused'),
    getCurrent: () => _reject('windows.getCurrent'),
    getAll: () => _reject('windows.getAll'),
    create: () => _reject('windows.create'),
    update: () => _reject('windows.update'),
    remove: () => _reject('windows.remove'),
    onRemoved: {
      addListener: () => _warn('windows.onRemoved.addListener'),
    },
  },
  browserAction: {
    setBadgeText: () => _warn('browserAction.setBadgeText'),
    setBadgeBackgroundColor: () =>
      _warn('browserAction.setBadgeBackgroundColor'),
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
    setUninstallURL: () => _warn('runtime.setUninstallURL'),
    onInstalled: {
      addListener: () => _warn('runtime.onInstalled.addListener'),
    },
    onMessageExternal: {
      addListener: () => _warn('runtime.onMessageExternal.addListener'),
    },
    onConnect: {
      addListener: () => _warn('runtime.onConnect.addListener'),
    },
    onConnectExternal: {
      addListener: () => _warn('runtime.onConnectExternal.addListener'),
    },
  },
  webRequest: {
    onErrorOccurred: {
      addListener: () => _warn('webRequest.onErrorOccurred.addListener'),
    },
  },
} as unknown as Browser;

export default browser;

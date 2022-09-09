import log from 'loglevel';
import ObfuscatedStore from './storage';

const _warn = (name) => {
  log.debug(`Browser method not supported - ${name}`);
};

const _reject = (name) => {
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject(`Browser method not supported - ${name}`);
};

/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */
export default {
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
      set: async (data) => {
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
};
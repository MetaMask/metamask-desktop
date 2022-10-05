import { Duplex } from 'stream';
import log from 'loglevel';
import ObfuscatedStore from '../storage';
import {
  Browser,
  BrowserProxyRequest,
  BrowserProxyResponse,
} from '../types/browser';
import { timeoutPromise, uuid } from '../utils/utils';

const TIMEOUT_REQUEST = 5000;

const UNHANDLED_FUNCTIONS = [
  'runtime.getBrowserInfo',
  'runtime.onConnect.addListener',
  'runtime.onConnectExternal.addListener',
  'runtime.onInstalled.addListener',
  'runtime.onMessageExternal.addListener',
  'runtime.sendMessage',
  'runtime.setUninstallURL',
  'webRequest.onErrorOccurred.addListener',
  'windows.onRemoved.addListener',
];

const PROXY_FUNCTIONS = [
  'browserAction.setBadgeBackgroundColor',
  'browserAction.setBadgeText',
  'tabs.query',
  'windows.create',
  'windows.getAll',
  'windows.getLastFocused',
  'windows.update',
];

const requestPromises: { [id: string]: (result: any) => void } = {};
let requestStream: Duplex;

const raw = {
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
  },
};

const warn = (key: string[]) => {
  log.debug(`Browser method not supported - ${key.join('.')}`);
};

const proxy = (key: string[], args: any[]) => {
  if (!requestStream) {
    log.error('Cannot send browser request as stream not registered', key);
    return undefined;
  }

  const requestId = uuid();
  const request: BrowserProxyRequest = { id: requestId, key, args };
  requestStream.write(request);

  log.debug('Sent browser request', { requestId, key, args });

  const waitForResultMessage = new Promise((resolve) => {
    requestPromises[requestId] = resolve;
  });

  return timeoutPromise(
    waitForResultMessage,
    TIMEOUT_REQUEST,
    `Timeout waiting for browser response - ${key.join('.')}`,
  ).catch((error) => {
    log.debug(error.message);
    delete requestPromises[requestId];
  });
};

const registerFunction = (
  browser: any,
  functionPathString: string,
  newFunction: (functionPath: string[], args: any[]) => any,
) => {
  const functionPath = functionPathString.split('.');
  const parentPath = functionPath.length > 1 ? functionPath.slice(0, -1) : [];
  const functionName = functionPath.slice(-1)[0];
  let targetObject = browser;
  const currentPath = [];

  for (const parentKey of parentPath) {
    currentPath.push(parentKey);

    let nextObject = targetObject[parentKey];

    if (!nextObject) {
      nextObject = {};
      targetObject[parentKey] = nextObject;
    }

    targetObject = nextObject;
  }

  targetObject[functionName] = (...args: any[]) =>
    newFunction(functionPath, args);
};

const registerFunctions = (
  browser: any,
  functionPaths: string[],
  newFunction: (functionPath: string[], args: any[]) => any,
) => {
  for (const functionPathString of functionPaths) {
    registerFunction(browser, functionPathString, newFunction);
  }
};

const onFunctionResponse = (data: BrowserProxyResponse) => {
  log.debug('Received browser response', data);

  const requestPromise = requestPromises[data.id];

  if (!requestPromise) {
    log.debug('Unrecognised ID in browser response');
    return;
  }

  requestPromise(data.result);
  delete requestPromises[data.id];
};

const init = (manualOverrides: any): Browser => {
  const browser = { ...manualOverrides };

  registerFunctions(browser, UNHANDLED_FUNCTIONS, warn);
  registerFunctions(browser, PROXY_FUNCTIONS, proxy);

  return browser;
};

export const browser: Browser = init(raw);

export const registerRequestStream = (stream: Duplex) => {
  requestStream = stream;
  requestStream.on('data', (data: BrowserProxyResponse) =>
    onFunctionResponse(data),
  );
};

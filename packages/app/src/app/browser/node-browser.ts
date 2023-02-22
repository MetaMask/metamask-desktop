import { Duplex } from 'stream';
import log from 'loglevel';
import { timeoutPromise, uuid } from '@metamask/desktop/dist/utils/utils';
import {
  Browser,
  BrowserProxyRequest,
  BrowserProxyResponse,
} from '@metamask/desktop/dist/types';
import ObfuscatedStore from '../storage/storage';
import {
  getDesktopVersion,
  getNumericalDesktopVersion,
} from '../utils/version';
import {
  WindowCreateRequest,
  WindowHandler,
  WindowUpdateRequest,
} from '../types/window';
import cfg from '../utils/config';

const TIMEOUT_REQUEST = 5000;
const PADDING_POPUP = 10;

const UNHANDLED_FUNCTIONS = [
  'notifications.onClicked.addListener',
  'notifications.onClicked.hasListener',
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

// browserAction has been replaced by action in MV3
const PROXY_FUNCTIONS = [
  'action.setBadgeBackgroundColor',
  'action.setBadgeText',
  'browserAction.setBadgeBackgroundColor',
  'browserAction.setBadgeText',
  'notifications.create',
  'runtime.getURL',
  'tabs.query',
  'windows.getAll',
  'windows.getLastFocused',
];

const requestPromises: { [id: string]: (result: any) => void } = {};
let requestStream: Duplex | undefined;
let windowHandler: WindowHandler | undefined;

const warn = (key: string[]) => {
  log.debug(`Browser method not supported - ${key.join('.')}`);
};

const proxy = (key: string[], args: any[]) => {
  log.debug('Sending browser request', { key, args });

  if (!requestStream) {
    log.error('Cannot send browser request as stream not registered', key);
    return undefined;
  }

  const requestId = uuid();
  const request: BrowserProxyRequest = { id: requestId, key, args };
  requestStream.write(request);

  const waitForResultMessage = new Promise((resolve) => {
    requestPromises[requestId] = resolve;
  });

  return timeoutPromise(waitForResultMessage, TIMEOUT_REQUEST, {
    errorMessage: `Timeout waiting for browser response - ${key.join('.')}`,
  }).catch((error) => {
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

const raw = {
  storage: {
    local: {
      get: () => ObfuscatedStore.getStore(),
      set: async (data: any) => {
        await ObfuscatedStore.setStore(data);
      },
      clear: () => ObfuscatedStore.clear(),
    },
  },
  runtime: {
    id: '1234',
    lastError: undefined,
    getManifest: () => ({
      manifest_version: 2,
      version: getNumericalDesktopVersion(),
      version_name: getDesktopVersion(),
    }),
    getPlatformInfo: () => Promise.resolve({ os: 'mac' }),
  },
  windows: {
    create: (request: WindowCreateRequest) => {
      let { left } = request;

      if (!cfg().disableExtensionPopup) {
        proxy(['windows', 'create'], [request]);
        left -= request.width + PADDING_POPUP;
      }

      return windowHandler?.create({
        ...request,
        left,
      });
    },
    remove: (windowId: string) => {
      if (!cfg().disableExtensionPopup) {
        proxy(['windows', 'remove'], [windowId]);
      }
      windowHandler?.remove(windowId);
    },
    update: (windowId: string, request: WindowUpdateRequest) => {
      if (!cfg().disableExtensionPopup) {
        proxy(['windows', 'update'], [windowId, request]);
      }

      return windowHandler?.update(request);
    },
  },
};

export const browser: Browser = init(raw);

export const registerRequestStream = (stream: Duplex) => {
  requestStream = stream;
  requestStream.on('data', (data: BrowserProxyResponse) =>
    onFunctionResponse(data),
  );
};

export const unregisterRequestStream = () => {
  if (!requestStream) {
    return;
  }

  requestStream.removeAllListeners();
  requestStream = undefined;
};

export const registerWindowHandler = (handler: WindowHandler) => {
  windowHandler = handler;
};

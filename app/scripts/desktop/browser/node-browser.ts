import { Duplex } from 'stream';
import log from 'loglevel';
import { NestedProxy } from '../nested-proxy';
import ObfuscatedStore from '../storage';
import {
  Browser,
  BrowserProxyRequest,
  BrowserProxyResponse,
} from '../types/browser';

const PROXY_WHITELIST = ['tabs', 'browserAction', 'windows'];

const requestPromises: { [id: number]: (result: any) => void } = {};
let requestIdCounter = 0;
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
  i18n: {
    getAcceptLanguages: () => ['en'],
  },
};

const warn = (key: string[]) => {
  log.debug(`Browser method not supported - ${key.join('.')}`);
};

const onFunctionRequest = (
  key: string[],
  args: any[],
  originalFunction?: (...originalArgs: any[]) => any,
) => {
  if (originalFunction) {
    return originalFunction(...args);
  }

  // eslint-disable-next-line no-plusplus
  const requestId = requestIdCounter++;
  const shouldProxy = key.length === 2 && PROXY_WHITELIST.includes(key[0]);

  if (!shouldProxy) {
    warn(key);
    return undefined;
  }

  if (!requestStream) {
    log.error('Cannot send browser request as stream not registered', key);
    return undefined;
  }

  const request: BrowserProxyRequest = { id: requestId, key, args };
  requestStream.write(request);

  log.debug('Sent browser request', { requestId, key, args });

  return new Promise((resolve) => {
    requestPromises[requestId] = resolve;
  });
};

const onFunctionResponse = (data: BrowserProxyResponse) => {
  log.debug('Received browser response', data);
  requestPromises[data.id]?.(data.result);
};

export const browser: Browser = new Proxy(
  raw,
  new NestedProxy({ functionOverride: onFunctionRequest }),
) as unknown as Browser;

export const registerRequestStream = (stream: Duplex) => {
  requestStream = stream;
  requestStream.on('data', (data: BrowserProxyResponse) =>
    onFunctionResponse(data),
  );
};

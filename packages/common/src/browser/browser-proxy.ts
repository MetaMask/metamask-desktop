import { Duplex } from 'stream';
import log from '../utils/log';
import { BrowserProxyRequest, BrowserProxyResponse } from '../types/browser';
import { browser } from './browser-polyfill';

let responseStream: Duplex;

const getBrowserMethod = (
  key: string[],
): ((...args: any[]) => any) | undefined => {
  let method = browser as any;

  for (const keyPart of key) {
    method = method[keyPart];

    if (!method) {
      return undefined;
    }
  }

  return method as any;
};

const onBrowserRequest = async (data: BrowserProxyRequest) => {
  log.debug('Received browser request', data);

  const method = getBrowserMethod(data.key);

  if (!method) {
    log.error(`Cannot find browser method - ${data.key.join('.')}`);
    return;
  }

  const result = await method(...data.args);
  const response: BrowserProxyResponse = { id: data.id, result };

  log.debug('Sending browser response', response);

  responseStream?.write(response);
};

export const registerResponseStream = (stream: Duplex) => {
  responseStream = stream;
  responseStream.on('data', (data: BrowserProxyRequest) =>
    onBrowserRequest(data),
  );
};

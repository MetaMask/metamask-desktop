/* eslint-disable node/global-require */
import cfg from './config';

if (cfg().desktop.isApp) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { Crypto } = require('@peculiar/webcrypto');

  // there is no shadow because on node 14 atob/btoa are not globals
  // and we are using an electron version that comes with node 14
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { atob, btoa } = require('abab');

  const crypto = new Crypto();
  global.self = {} as unknown as Window & typeof globalThis;

  global.crypto = {
    randomUUID: crypto.randomUUID,
    getRandomValues: crypto.getRandomValues,
    subtle: crypto.subtle,
  };

  global.navigator = {
    userAgent: 'Firefox',
  } as Navigator;

  global.atob = atob;
  global.btoa = btoa;

  global.window = {
    navigator: global.navigator,
    location: {
      href: 'test.com',
    },
    postMessage: () => undefined,
    addEventListener: () => undefined,
  } as unknown as Window & typeof globalThis;

  global.document = {
    createElement: () => ({
      pathname: '/',
      setAttribute: () => undefined,
    }),
    head: {
      appendChild: () => undefined,
    },
  } as unknown as Document;
}

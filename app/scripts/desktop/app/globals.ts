import cfg from '../utils/config';

if (cfg().desktop.isApp) {
  global.self = {} as unknown as Window & typeof globalThis;

  // Ternary prevents LavaMoat failing as the library can't be found
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  global.crypto = require(cfg().desktop.isApp ? `node:crypto` : ``).webcrypto;

  global.navigator = {
    userAgent: 'Firefox',
  } as Navigator;

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

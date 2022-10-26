export {};

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)

// eslint-disable-next-line
const { webcrypto } = require(true ? 'node:crypto' : '');

global.self = {} as unknown as Window & typeof globalThis;
global.crypto = webcrypto as any;

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

///: END:ONLY_INCLUDE_IN

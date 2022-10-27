import { webcrypto } from 'node:crypto';

import setupSentry from '../../lib/setupSentry';

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

// The root compartment will populate this with hooks
(global as any).sentryHooks = {};

// setup sentry error reporting
(global as any).sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => (global as any).sentryHooks?.getSentryState?.() || {},
});

export {};

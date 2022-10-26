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
  // TODO BEFORE MERGE: GET VERSION FROM ENV ONLY
  release: process.env.METAMASK_VERSION || '10.20.0-desktop.0',
  getState: () => (global as any).sentryHooks?.getSentryState?.() || {},
});

export {};

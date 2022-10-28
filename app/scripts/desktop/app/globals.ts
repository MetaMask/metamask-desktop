import { webcrypto } from 'node:crypto';

import setupSentry from '../../lib/setupSentry';

declare const global: typeof globalThis & {
  sentryHooks: Record<string, any>;
  sentry: unknown;
};

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
global.sentryHooks = {};

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.sentryHooks?.getSentryState?.() || {},
});

export {};

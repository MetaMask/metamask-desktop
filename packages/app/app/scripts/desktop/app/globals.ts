import 'global-agent/bootstrap';
import '../browser/browser-init';
import { webcrypto } from 'node:crypto';
import { Headers } from 'node-fetch';
import setupSentry from '../../lib/setupSentry';
import { getDesktopVersion } from '../utils/version';

declare const global: typeof globalThis & {
  stateHooks: Record<string, any>;
  sentry: unknown;
  initialised: boolean;
};

if (!global.initialised) {
  global.self = {} as unknown as Window & typeof globalThis;
  global.crypto = webcrypto as any;

  global.navigator = {
    userAgent: 'Firefox',
  } as Navigator;

  global.window = {
    Headers,
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
  global.stateHooks = {};

  // setup sentry error reporting
  global.sentry = setupSentry({
    release: getDesktopVersion(),
    getState: () => global.stateHooks?.getSentryState?.() || {},
  });

  global.initialised = true;
}

export {};

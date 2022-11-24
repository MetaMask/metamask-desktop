import setupSentry from '../../lib/setupSentry';
import { getDesktopVersion } from '../utils/version';

declare const global: typeof globalThis & {
  stateHooks: Record<string, any>;
  sentry: unknown;
};

if (!global.sentry) {
  // The root compartment will populate this with hooks
  global.stateHooks = {};

  // setup sentry error reporting
  global.sentry = setupSentry({
    release: getDesktopVersion(),
    getState: () => global.stateHooks?.getSentryState?.() || {},
  });
}

export {};

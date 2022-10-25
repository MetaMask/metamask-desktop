import setupSentry from './lib/setupSentry';

// TO BE REMOVED BEFORE MERGING
console.log('SENTRY INSTALL');

// The root compartment will populate this with hooks
global.sentryHooks = {};

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.sentryHooks?.getSentryState?.() || {},
});

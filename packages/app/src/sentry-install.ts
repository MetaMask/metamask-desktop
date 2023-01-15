import setupSentry from './app/renderer/setup-sentry';

declare const global: typeof globalThis & {
  sentry: unknown;
};

// setup sentry error reporting
global.sentry = setupSentry({
  release: `desktop-app-renderer`,
});

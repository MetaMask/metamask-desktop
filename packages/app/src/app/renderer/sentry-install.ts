import * as Sentry from '@sentry/electron/renderer';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { getSentryDefaultOptions } from './setup-sentry';

declare const global: typeof globalThis & {
  sentry: unknown;
};

// TODO Pick version from either window.electronBridge object or from getDesktopVersion
const sentryDefaultOptions = getSentryDefaultOptions(`desktop-app-renderer`);

Sentry.init({
  ...sentryDefaultOptions,
  integrations: [
    // TODO Custom filter that uses UI state only
    new Dedupe() as Integration,
    new ExtraErrorData() as Integration,
  ],
});

global.sentry = Sentry;

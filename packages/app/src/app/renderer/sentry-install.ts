import * as Sentry from '@sentry/electron/renderer';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { getSentryDefaultOptions } from './setup-sentry';

declare const global: typeof globalThis & {
  sentry: unknown;
};

// TODO Pick version from getDesktopVersion in the build-ui process
const sentryDefaultOptions = getSentryDefaultOptions(
  `${process.env.PACKAGE_VERSION}-desktop.0`,
);

Sentry.init({
  ...sentryDefaultOptions,
  integrations: [
    // TODO Custom filter that uses UI state only
    new Dedupe() as Integration,
    new ExtraErrorData() as Integration,
  ],
});

global.sentry = Sentry;

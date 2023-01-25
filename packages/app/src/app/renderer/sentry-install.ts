import * as Sentry from '@sentry/electron/renderer';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { getSentryDefaultOptions } from './setup-sentry';

declare const global: typeof globalThis & {
  sentry: unknown;
};

const environment =
  process.env.METAMASK_BUILD_TYPE === 'main'
    ? process.env.METAMASK_ENVIRONMENT
    : `${process.env.METAMASK_ENVIRONMENT}-${process.env.METAMASK_BUILD_TYPE}`;

const sentryDefaultOptions = getSentryDefaultOptions({
  release: `${process.env.PACKAGE_VERSION}-desktop.0`,
  environment: `${environment}`,
});

Sentry.init({
  ...sentryDefaultOptions,
  integrations: [
    // TODO Custom filter that uses UI state only
    new Dedupe() as Integration,
    new ExtraErrorData() as Integration,
  ],
});

global.sentry = Sentry;

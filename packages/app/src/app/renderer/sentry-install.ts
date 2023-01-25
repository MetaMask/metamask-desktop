import * as Sentry from '@sentry/electron/renderer';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { FilterEvents } from 'submodules/extension/app/scripts/lib/sentry-filter-events';
import { getSentryDefaultOptions } from './setup-sentry';

declare const global: typeof globalThis & {
  sentry: unknown;
};
const sentryDefaultOptions = getSentryDefaultOptions(
  `${process.env.PACKAGE_VERSION}-desktop.0`,
);

Sentry.init({
  ...sentryDefaultOptions,
  integrations: [
    new FilterEvents({
      getMetaMetricsEnabled: () => {
        // TODO
        // We are not currently sending metrics through this Sentry instance
        // Add filter when we do
        const desktopMetaMetricsOptIn = false;

        electronLog.debug('Sentry metric filter for renderer process', {
          desktopMetaMetricsOptIn,
        });

        return desktopMetaMetricsOptIn;
      },
    }),
    new Dedupe() as Integration,
    new ExtraErrorData() as Integration,
  ],
});

global.sentry = Sentry;

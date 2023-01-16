import { release } from 'os';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import * as Sentry from '@sentry/electron/renderer';
import { Integration, Options } from '@sentry/types';

export const getSentryDefaultOptions = (
  release: string,
): Options | undefined => {
  const METAMASK_DEBUG = process.env.METAMASK_DEBUG === '1';
  const { METAMASK_ENVIRONMENT } = process.env;
  const SENTRY_DSN_DEV =
    process.env.SENTRY_DSN_DEV ||
    'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496';
  const { METAMASK_BUILD_TYPE } = process.env;
  const { IN_TEST } = process.env;

  if (METAMASK_DEBUG && !IN_TEST) {
    /**
     * Workaround until the following issue is resolved
     * https://github.com/MetaMask/metamask-extension/issues/15691
     * The IN_TEST condition allows the e2e tests to run with both
     * yarn start:test and yarn build:test
     */
    return undefined;
  }

  const environment =
    METAMASK_BUILD_TYPE === 'main'
      ? METAMASK_ENVIRONMENT
      : `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`;

  let sentryTarget;
  if (METAMASK_ENVIRONMENT === 'production') {
    if (!process.env.SENTRY_DSN) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }

    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN`,
    );
    sentryTarget = process.env.SENTRY_DSN;
  } else {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN_DEV`,
    );
    sentryTarget = SENTRY_DSN_DEV;
  }

  return {
    dsn: sentryTarget,
    debug: METAMASK_DEBUG,
    environment,
    release,
  };
};

export default function setupSentry(opts: {
  release: string;
}): typeof Sentry | undefined {
  const sentryDefaultOptions = getSentryDefaultOptions(opts.release);

  // return if options are not available
  if (!sentryDefaultOptions) {
    return undefined;
  }

  Sentry.init({
    ...sentryDefaultOptions,
    integrations: [
      new Dedupe() as Integration,
      new ExtraErrorData() as Integration,
    ],
  });

  return Sentry;
}

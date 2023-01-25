import { Options } from '@sentry/types';

export const getSentryDefaultOptions = ({
  release,
  environment,
}: {
  release: string;
  environment: string;
}): Options | undefined => {
  const sentryTarget = process.env.SENTRY_DSN;
  if (process.env.METAMASK_ENVIRONMENT === 'production') {
    if (!sentryTarget) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }

    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN`,
    );
  } else if (sentryTarget) {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN_DEV`,
    );
  }

  return {
    enabled: Boolean(sentryTarget),
    dsn: sentryTarget,
    debug: process.env.METAMASK_DEBUG === '1',
    environment,
    release,
  };
};

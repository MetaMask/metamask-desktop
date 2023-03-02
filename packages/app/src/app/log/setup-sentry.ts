import { Options } from '@sentry/types';

export const getSentryDefaultOptions = (
  release: string,
): Options | undefined => {
  const sentryTarget = process.env.SENTRY_DSN;
  if (process.env.METAMASK_ENVIRONMENT === 'production' && !sentryTarget) {
    throw new Error(
      `Missing SENTRY_DSN environment variable in production environment`,
    );
  }

  return {
    enabled: Boolean(sentryTarget),
    dsn: sentryTarget,
    debug: process.env.METAMASK_DEBUG === '1',
    environment: process.env.METAMASK_ENVIRONMENT,
    release,
  };
};

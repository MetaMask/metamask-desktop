import {
  METAMASK_ENVIRONMENT_DEV_MOCK,
  METAMASK_ENVIRONMENT_PROD_MOCK,
  RELEASE_MOCK,
  SENTRY_DSN_MOCK,
} from '../../../test/mocks';
import { getSentryDefaultOptions } from './setup-sentry';

jest.mock('@sentry/electron/renderer');

describe('getSentryDefaultOptions', () => {
  it('should throw missing SENTRY_DNS', () => {
    process.env.METAMASK_ENVIRONMENT = METAMASK_ENVIRONMENT_PROD_MOCK;
    expect(() => {
      getSentryDefaultOptions(RELEASE_MOCK);
    }).toThrow(
      'Missing SENTRY_DSN environment variable in production environment',
    );
  });

  it('should disable sentry when no DSN is passed in development', () => {
    process.env.METAMASK_ENVIRONMENT = METAMASK_ENVIRONMENT_DEV_MOCK;
    process.env.SENTRY_DSN = '';
    expect(getSentryDefaultOptions(RELEASE_MOCK)).toStrictEqual({
      enabled: false,
      dsn: process.env.SENTRY_DSN,
      debug: false,
      environment: METAMASK_ENVIRONMENT_DEV_MOCK,
      release: RELEASE_MOCK,
    });
  });

  it.each([
    ['1', true],
    ['0', false],
    [undefined, false],
  ])(
    'should set sentry debug with METAMASK_DEBUG',
    (metamaskDebug, expectedDebug) => {
      process.env.METAMASK_DEBUG = metamaskDebug;
      process.env.METAMASK_ENVIRONMENT = METAMASK_ENVIRONMENT_DEV_MOCK;
      process.env.SENTRY_DSN = SENTRY_DSN_MOCK;
      expect(getSentryDefaultOptions(RELEASE_MOCK)).toStrictEqual({
        enabled: true,
        dsn: SENTRY_DSN_MOCK,
        debug: expectedDebug,
        environment: METAMASK_ENVIRONMENT_DEV_MOCK,
        release: RELEASE_MOCK,
      });
    },
  );
});

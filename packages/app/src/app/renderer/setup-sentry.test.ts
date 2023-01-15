import {
  METAMASK_ENVIRONMENT_DEV_MOCK,
  METAMASK_ENVIRONMENT_PROD_MOCK,
  RELEASE_MOCK,
  SENTRY_DNS_DEV_MOCK,
  SENTRY_DNS_PROD_MOCK,
} from '../../../test/mocks';
import setupSentry, { getSentryDefaultOptions } from './setup-sentry';

jest.mock('@sentry/electron/renderer');

describe('Setup Sentry', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns sentry instance', () => {
    const sentry = setupSentry({
      release: RELEASE_MOCK,
    });
    expect(sentry).toBeDefined();
  });

  it('should throw missing SENTRY_DNS', () => {
    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(() => {
      getSentryDefaultOptions(RELEASE_MOCK);
    }).toThrow(
      'Missing SENTRY_DSN environment variable in production environment',
    );
  });
});

describe('getSentryDefaultOptions', () => {
  it('should return undefined if METAMASK_DEBUG is set and IN_TEST is not set', () => {
    process.env.METAMASK_DEBUG = '1';
    expect(getSentryDefaultOptions(RELEASE_MOCK)).toBeUndefined();
  });

  it('should return the default development sentry options', () => {
    process.env.METAMASK_DEBUG = '1';
    process.env.IN_TEST = '1';
    process.env.METAMASK_ENVIRONMENT = METAMASK_ENVIRONMENT_DEV_MOCK;
    process.env.METAMASK_BUILD_TYPE = 'main';
    process.env.SENTRY_DSN_DEV = SENTRY_DNS_DEV_MOCK;
    expect(getSentryDefaultOptions(RELEASE_MOCK)).toEqual({
      dsn: SENTRY_DNS_DEV_MOCK,
      debug: true,
      environment: METAMASK_ENVIRONMENT_DEV_MOCK,
      release: RELEASE_MOCK,
    });
  });

  it('should return the default production options', () => {
    process.env.METAMASK_DEBUG = '0';
    process.env.IN_TEST = undefined;
    process.env.METAMASK_ENVIRONMENT = METAMASK_ENVIRONMENT_PROD_MOCK;
    process.env.METAMASK_BUILD_TYPE = 'main';
    process.env.SENTRY_DSN = SENTRY_DNS_PROD_MOCK;
    expect(getSentryDefaultOptions(RELEASE_MOCK)).toEqual({
      dsn: SENTRY_DNS_PROD_MOCK,
      debug: false,
      environment: METAMASK_ENVIRONMENT_PROD_MOCK,
      release: RELEASE_MOCK,
    });
  });
});

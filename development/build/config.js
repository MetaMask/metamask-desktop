const path = require('path');
const { readFile } = require('fs/promises');
const ini = require('ini');
const { BuildType } = require('../lib/build-type');

/**
 * Get configuration for non-production builds.
 *
 * @returns {object} The production configuration.
 */
async function getConfig() {
  const configPath = path.resolve(__dirname, '..', '..', '.metamaskrc');
  let configContents = '';
  try {
    configContents = await readFile(configPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  return {
    COLLECTIBLES_V1: process.env.COLLECTIBLES_V1,
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    ONBOARDING_V2: process.env.ONBOARDING_V2,
    PHISHING_WARNING_PAGE_URL: process.env.PHISHING_WARNING_PAGE_URL,
    PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY,
    PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY,
    SEGMENT_HOST: process.env.SEGMENT_HOST,
    SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY,
    SENTRY_DSN_DEV:
      process.env.SENTRY_DSN_DEV ??
      'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496',
    SIWE_V1: process.env.SIWE_V1,
    SWAPS_USE_DEV_APIS: process.env.SWAPS_USE_DEV_APIS,
    METAMASK_DEBUG: process.env.METAMASK_DEBUG,
    DESKTOP: process.env.DESKTOP,
    DISABLE_WEB_SOCKET_ENCRYPTION: process.env.DISABLE_WEB_SOCKET_ENCRYPTION,
    ...ini.parse(configContents),
  };
}

/**
 * Get configuration for production builds and perform validation.
 *
 * This function validates that all required variables are present, and that
 * the production configuration file doesn't include any extraneous entries.
 *
 * @param {BuildType} buildType - The current build type (e.g. "main", "flask",
 * etc.).
 * @returns {object} The production configuration.
 */
async function getProductionConfig(buildType) {
  const prodConfigPath = path.resolve(__dirname, '..', '..', '.metamaskprodrc');
  let prodConfigContents = '';
  try {
    prodConfigContents = await readFile(prodConfigPath, {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  const prodConfig = {
    INFURA_BETA_PROJECT_ID: process.env.INFURA_BETA_PROJECT_ID,
    INFURA_FLASK_PROJECT_ID: process.env.INFURA_FLASK_PROJECT_ID,
    INFURA_PROD_PROJECT_ID: process.env.INFURA_PROD_PROJECT_ID,
    PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY,
    PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY,
    SEGMENT_BETA_WRITE_KEY: process.env.SEGMENT_BETA_WRITE_KEY,
    SEGMENT_FLASK_WRITE_KEY: process.env.SEGMENT_FLASK_WRITE_KEY,
    SEGMENT_PROD_WRITE_KEY: process.env.SEGMENT_PROD_WRITE_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    ...ini.parse(prodConfigContents),
  };

  const requiredEnvironmentVariables = {
    all: ['PUBNUB_PUB_KEY', 'PUBNUB_SUB_KEY', 'SENTRY_DSN'],
    [BuildType.beta]: ['INFURA_BETA_PROJECT_ID', 'SEGMENT_BETA_WRITE_KEY'],
    [BuildType.flask]: ['INFURA_FLASK_PROJECT_ID', 'SEGMENT_FLASK_WRITE_KEY'],
    [BuildType.main]: ['INFURA_PROD_PROJECT_ID', 'SEGMENT_PROD_WRITE_KEY'],
  };

  for (const required of [
    ...requiredEnvironmentVariables.all,
    ...requiredEnvironmentVariables[buildType],
  ]) {
    if (!prodConfig[required]) {
      throw new Error(`Missing '${required}' environment variable`);
    }
  }

  const allValid = Object.values(requiredEnvironmentVariables).flat();
  for (const environmentVariable of Object.keys(prodConfig)) {
    if (!allValid.includes(environmentVariable)) {
      throw new Error(`Invalid environment variable: '${environmentVariable}'`);
    }
  }
  return prodConfig;
}

module.exports = { getConfig, getProductionConfig };

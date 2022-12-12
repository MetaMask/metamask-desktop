/* eslint-disable node/no-process-env, node/no-unpublished-require, jsdoc/require-jsdoc */
const path = require('path');
const { readFile } = require('fs/promises');
const ini = require('ini');
const { notarize } = require('electron-notarize');

const configurationPropertyNames = ['APPLEID', 'APPLEIDPASS'];

async function getConfig() {
  const configPath = path.resolve(__dirname, '.apprc');
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

  const environmentVariables = {};
  for (const propertyName of configurationPropertyNames) {
    if (process.env[propertyName]) {
      environmentVariables[propertyName] = process.env[propertyName];
    }
  }

  return {
    APPLE_ID: process.env.APPLE_ID,
    APPLE_ID_PASS: process.env.APPLE_ID_PASS,
    APP_BUNDLE_ID: process.env.APP_BUNDLE_ID,
    ...ini.parse(configContents),
  };
}

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  const config = await getConfig();

  await notarize({
    appBundleId: config.APP_BUNDLE_ID,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: config.APPLE_ID,
    appleIdPassword: config.APPLE_ID_PASS,
  });
};

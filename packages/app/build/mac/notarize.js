/* eslint-disable node/no-process-env, node/no-unpublished-require, jsdoc/require-jsdoc */
const { notarize } = require('electron-notarize');

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  await notarize({
    tool: 'notarytool',
    teamId: process.env.APPLE_TEAM_ID,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  });
};

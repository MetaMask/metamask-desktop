/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/default */
/* eslint-disable import/namespace */
/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/match-description */
import launchDesktopUi from '../ui';

start().catch((error) => {
  __electronLog.error('Error starting desktop app', error);
});

/**
 * Starts the desktop app
 */
function start() {
  return launchDesktopUi();
}

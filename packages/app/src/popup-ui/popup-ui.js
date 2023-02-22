/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/default */
/* eslint-disable import/no-unassigned-import */
/* eslint-disable import/namespace */
/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/match-description */
import './browser-shim';
import launchPopupUi from '.';

start().catch((error) => {
  __electronLog.error('Error starting desktop app', error);
});

/**
 * Starts the desktop app
 */
function start() {
  return launchPopupUi();
}

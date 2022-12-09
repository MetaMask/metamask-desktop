/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/default */
/* eslint-disable import/namespace */
import launchDesktopUi from '../ui';

start().catch((error) => {
  console.log('Error starting desktop app', error);
});

function start() {
  return launchDesktopUi();
}

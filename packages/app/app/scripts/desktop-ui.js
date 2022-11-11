import launchDesktopUi from '../../ui/desktop';

start().catch((error) => {
  console.log('Error starting desktop app', error);
});

function start() {
  return launchDesktopUi();
}

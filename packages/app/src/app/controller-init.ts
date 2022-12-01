import { initDesktopControllerAppLogic } from '@metamask/desktop/dist/controllers/desktop';
import DesktopApp from './desktop-app';

const disableDesktop = async () => {
  const connection = DesktopApp.getConnection();

  if (!connection) {
    return;
  }

  await connection.disable();
};

initDesktopControllerAppLogic({
  disableDesktop,
});

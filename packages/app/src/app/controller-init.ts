import { initDesktopControllerAppLogic } from '@metamask/desktop/dist/controllers/desktop';
import DesktopApp from './desktop-app';

const disableDesktop = async () => {
  DesktopApp.getConnection()?.disable() || Promise.resolve();
};

initDesktopControllerAppLogic({
  disableDesktop,
});

import { initDesktopController } from '@metamask/desktop/dist/controllers/desktop';
import { DesktopController as BaseDesktopController } from '@metamask/desktop/dist/controllers/desktop-base';
import DesktopApp from './desktop-app';

export class AppDesktopController extends BaseDesktopController {
  public override async disableDesktop() {
    const connection = DesktopApp.getConnection();

    if (!connection) {
      return;
    }

    await connection.disable();
  }
}

initDesktopController(AppDesktopController);

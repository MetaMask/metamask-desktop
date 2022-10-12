import { ObservableStore } from '@metamask/obs-store';
import cfg from '../desktop/utils/config';
import { ExtensionPairing } from '../desktop/shared/pairing';

let DesktopApp;
let DesktopManager;

if (cfg().desktop.isApp) {
  // eslint-disable-next-line node/global-require
  DesktopApp = require('../desktop/app/desktop-app').default;
}

if (cfg().desktop.isExtension) {
  // eslint-disable-next-line node/global-require
  DesktopManager = require('../desktop/extension/desktop-manager').default;
}

export default class DesktopController {
  constructor(opts = {}) {
    const { initState } = opts;

    this.store = new ObservableStore({
      desktopEnabled: false,
      ...initState,
    });
  }

  setDesktopEnabled(desktopEnabled) {
    this.store.updateState({
      desktopEnabled,
    });
  }

  generateOtp() {
    return ExtensionPairing.generateOTP();
  }

  async testDesktopConnection() {
    return await DesktopManager?.testConnection();
  }

  async disableDesktop() {
    return await DesktopApp?.getConnection()?.disable();
  }
}

import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import cfg from '../desktop/config';
import { ExtensionPairing } from '../desktop/pairing';

let DesktopManager;

if (cfg().desktop.isExtension) {
  // eslint-disable-next-line node/global-require
  DesktopManager = require('../desktop/desktop-manager').default;
}

export default class DesktopController {
  constructor(opts = {}) {
    const { initState } = opts;

    this.store = new ObservableStore({
      desktopEnabled: false,
      isPairing: false,
      ...initState,
    });
  }

  setDesktopEnabled(desktopEnabled) {
    this.store.updateState({
      desktopEnabled,
    });
  }

  setIsPairing(isPairing) {
    this.store.updateState({
      isPairing,
    });
  }

  generateOtp() {
    return ExtensionPairing.generateOTP();
  }

  async testDesktopConnection() {
    try {
      return await DesktopManager?.testConnection();
    } catch (error) {
      log.error(error);
      return { success: false };
    }
  }
}

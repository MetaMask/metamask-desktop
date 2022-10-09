import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import cfg from '../desktop/config';

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
      desktopPairingOtp: 0,
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

  setOtpPairing(desktopPairingOtp) {
    this.store.updateState({
      desktopPairingOtp,
    });
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

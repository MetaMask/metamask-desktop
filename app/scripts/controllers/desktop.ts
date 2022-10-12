import { ObservableStore } from '@metamask/obs-store';
import cfg from '../desktop/utils/config';
import { ExtensionPairing } from '../desktop/shared/pairing';
import { TestConnectionResult } from '../desktop/types/desktop';

let DesktopApp: any;
let DesktopManager: any;

if (cfg().desktop.isApp) {
  // eslint-disable-next-line node/global-require
  DesktopApp = require('../desktop/app/desktop-app').default;
}

if (cfg().desktop.isExtension) {
// eslint-disable-next-line node/global-require
DesktopManager = require('../desktop/extension/desktop-manager').default;
}

export default class DesktopController {
  private store: ObservableStore;

  constructor({ initState }: { initState: any }) {
    this.store = new ObservableStore({
      desktopEnabled: false,
      ...initState,
    });
  }

  public setDesktopEnabled(desktopEnabled: boolean) {
    this.store.updateState({
      desktopEnabled,
    });
  }

  public generateOtp(): string {
    return ExtensionPairing.generateOTP();
  }

  public async testDesktopConnection(): Promise<TestConnectionResult> {
    return await DesktopManager?.testConnection();
  }

  public async disableDesktop() {
    await DesktopApp?.getConnection()?.disable();
  }
}

import { ObservableStore } from '@metamask/obs-store';
import { ExtensionPairing } from '../desktop/shared/pairing';
import { TestConnectionResult } from '../desktop/types/desktop';

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
// eslint-disable-next-line import/first
import DesktopApp from '../desktop/app/desktop-app';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
import DesktopManager from '../desktop/extension/desktop-manager';
///: END:ONLY_INCLUDE_IN

export default class DesktopController {
  private store: ObservableStore;

  constructor({ initState }: { initState: any }) {
    this.store = new ObservableStore({
      desktopEnabled: false,
      pairingKey: undefined,
      ...initState,
    });
  }

  public getDesktopEnabled() {
    return this.store.getState().desktopEnabled === true;
  }

  public setDesktopEnabled(desktopEnabled: boolean) {
    this.store.updateState({
      desktopEnabled,
    });
  }

  setPairingKey(pairingKey: string) {
    this.store.updateState({
      pairingKey,
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

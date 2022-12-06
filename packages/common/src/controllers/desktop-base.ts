import { ObservableStore } from '@metamask/obs-store';
import { TestConnectionResult } from '../types';

export abstract class DesktopController {
  private store: ObservableStore;

  constructor({ initState }: { initState: any }) {
    this.store = new ObservableStore({
      desktopEnabled: false,
      pairingKey: undefined,
      pairingKeyHash: undefined,
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

  public setPairingKey(pairingKey: string) {
    this.store.updateState({
      pairingKey,
    });
  }

  public generateOtp(): string {
    throw Error('No implementation provided');
  }

  public async testDesktopConnection(): Promise<TestConnectionResult> {
    throw Error('No implementation provided');
  }

  public async disableDesktop() {
    throw Error('No implementation provided');
  }
}

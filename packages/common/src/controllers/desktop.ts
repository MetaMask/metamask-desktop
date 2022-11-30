import { ObservableStore } from '@metamask/obs-store';
import { TestConnectionResult } from '../types';

export interface ExtensionLogic {
  generateOTP: () => string;
  testConnection: () => Promise<TestConnectionResult>;
}

export interface AppLogic {
  disableDesktop: () => Promise<void>;
}

let extensionLogic: ExtensionLogic;
let appLogic: AppLogic;

export const initDesktopControllerExtensionLogic = (
  newExtensionLogic: ExtensionLogic,
) => {
  extensionLogic = newExtensionLogic;
};

export const initDesktopControllerAppLogic = (newAppLogic: AppLogic) => {
  appLogic = newAppLogic;
};

export class DesktopController {
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

  setPairingKey(pairingKey: string) {
    this.store.updateState({
      pairingKey,
    });
  }

  public generateOtp(): string {
    return extensionLogic?.generateOTP();
  }

  public async testDesktopConnection(): Promise<TestConnectionResult> {
    return await extensionLogic?.testConnection();
  }

  public async disableDesktop() {
    await appLogic?.disableDesktop();
  }
}

if (!(global as any).isDesktopApp) {
  // eslint-disable-next-line import/no-unassigned-import, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const newExtensionLogic = require('./init').extensionLogic;
  initDesktopControllerExtensionLogic(newExtensionLogic);
}

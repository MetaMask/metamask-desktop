import { TestConnectionResult } from '../types';
import desktopManager from '../desktop-manager';
import { Pairing } from '../pairing';
import { DesktopController as BaseDesktopController } from './desktop-base';

export class ExtensionDesktopController extends BaseDesktopController {
  public override generateOtp(): string {
    return Pairing.generateOTP();
  }

  public override async testDesktopConnection(): Promise<TestConnectionResult> {
    return await desktopManager.testConnection();
  }
}

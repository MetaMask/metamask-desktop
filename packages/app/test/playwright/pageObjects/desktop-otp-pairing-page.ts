import { Page, expect } from '@playwright/test';
import { delay } from '../helpers/utils';

export class DesktopOTPPage {
  readonly window: Page;

  constructor(window: Page) {
    this.window = window;
  }

  async setOtpPairingKey(optPairingKey: string) {
    await this.window.screenshot({
      path: 'test/playwright/test-results/visual/desktop-otp-pairing.main.png',
      fullPage: true,
    });

    for (const [index, element] of optPairingKey.split('').entries()) {
      await this.window
        .locator(`[data-testid="pair-otp-input-${index}"]`)
        .type(element);
    }

    await delay(3000);

    await this.window.screenshot({
      path: 'test/playwright/test-results/visual/desktop-all-set.main.png',
      fullPage: true,
    });
  }

  async checkIsActive() {
    await this.window.locator('text=Go to Settings').click();
    await this.window.screenshot({
      path: 'test/playwright/test-results/visual/desktop-active.main.png',
      fullPage: true,
    });

    await expect(this.window.locator('.mmd-pair-status')).toContainText(
      'Active',
    );
  }

  async checkIsInactive() {
    await this.window.screenshot({
      path: 'test/playwright/test-results/visual/desktop-inactive.main.png',
      fullPage: true,
    });

    await expect(
      this.window.locator('text=Pair with your Metamask extension'),
    ).toBeVisible();
  }

  async removeConnection() {
    await this.window.locator('text=Remove Connection').click();
  }

  async pairWithMetamask() {
    await this.window.locator('text=Pair with your Metamask extension').click();
  }
}

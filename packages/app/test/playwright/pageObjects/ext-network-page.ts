import { Locator, Page } from '@playwright/test';

export class ExtensionNetworkPage {
  readonly page: Page;

  readonly networkBtn: Locator;

  readonly showHideBtn: Locator;

  readonly showHideSettingToggle: Locator;

  readonly closeSettingsBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkBtn = page.locator('.network-display');
    this.showHideBtn = page.locator('a:has-text("Show/hide")');
    this.showHideSettingToggle = page.locator(
      `//div[@data-testid="advanced-setting-show-testnet-conversion"][2]//div[contains(@class, 'toggle-button')]/div[1]`,
    );
    this.closeSettingsBtn = page.locator('.settings-page__close-button');
  }

  async open() {
    await this.networkBtn.click();
  }

  async showTestnet() {
    // TODO: Assert if is not already selected
    await this.showHideBtn.click();
    await this.showHideSettingToggle.click();
    await this.closeSettingsBtn.click();
  }

  async selectNetwork(network: string) {
    await this.page.locator(`.network-name-item >> text=${network}`).click();
    // TODO: Asserta that network is selected
  }
}

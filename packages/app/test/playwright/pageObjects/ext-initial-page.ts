/* eslint-disable jest/no-standalone-expect */
import { expect, Locator, Page } from '@playwright/test';

export class ExtensionInitialPage {
  readonly page: Page;

  readonly activityTab: Locator;

  readonly mainMenu: Locator;

  constructor(page: Page) {
    this.page = page;

    this.activityTab = page.locator('button:has-text("Activity")');
    this.mainMenu = page.locator('data-testid=account-menu-icon');
  }

  async closeWhatsNewBanner() {
    await this.page.locator('data-testid=popover-close').click();
  }

  async closeHelpUsImproveBanner() {
    await this.page.locator('button:has-text("I agree")').click();
  }

  async openMainMenu() {
    await this.mainMenu.click();
  }

  async bringToFront() {
    await this.page.bringToFront();
  }

  async openActivityTab() {
    await this.activityTab.click();
  }

  async checkLastTransactionAction(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    // eslint-disable-next-line jest/no-standalone-expect
    await expect(
      this.page.locator('.transaction-list-item >> nth=0 >> .list-item__title'),
    ).toHaveText(status);
  }

  async checkLastTransactionCSS(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    // eslint-disable-next-line jest/no-standalone-expect
    expect(
      this.page.locator(
        `.transaction-list-item >> nth=0 >> transaction-status--${status}`,
      ),
    ).toBeVisible();
  }

  async checkLastTransactionStatus(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    await expect(this.page.locator('.list-item__subheading')).toContainText(
      status,
      { ignoreCase: true },
    );
  }

  async hasDesktopEnabled() {
    await this.openExperimentalTab();
    await expect(this.page.locator('text="Disable Desktop App"')).toHaveCount(
      1,
    );
  }

  async desktopAppIs(status: 'enabled' | 'disabled') {
    await this.openExperimentalTab();
    if (status === 'enabled') {
      await expect(this.page.locator('text="Disable Desktop App"')).toHaveCount(
        1,
      );
    } else {
      await expect(this.page.locator('text="Enable Desktop App"')).toHaveCount(
        1,
      );
    }
    // Close settings
    await this.closeSettings();
  }

  async closeSettings() {
    await this.page
      .locator('.settings-page__header__title-container__close-button')
      .click();
  }

  async disableDesktop() {
    await this.hasDesktopEnabled();
    await this.page.locator('text="Disable Desktop App"').click();
  }

  async openExperimentalTab() {
    await this.openMainMenu();
    await this.page.locator('text="Settings"').click();
    await this.page.locator('text="Experimental"').click();
  }

  async getCustodianTXId() {
    const custodianTxId = await this.page.$eval(
      '.test-transaction-meta',
      (el) => el.getAttribute('data-custodiantransactionid'),
    );
    return custodianTxId as string;
  }

  async selectMainAction(action: string) {
    await this.page
      .locator('.wallet-overview__buttons', { hasText: `${action}` })
      .click();
  }

  async cancelSend() {
    await this.page.locator('text=cancel').click();
  }

  async hasFunds() {
    const funds = await this.page.locator('.currency-display-component__text');
    // eslint-disable-next-line jest/prefer-strict-equal
    expect(funds).not.toEqual('0');
  }

  async sendFunds(account: string) {
    await this.page.locator('data-testid=ens-input').type(`${account}`);
    await this.page.locator('text="Next"').click();
    await this.page.locator('text="Confirm"').click();
  }

  async createAccount(accountName: string) {
    await this.openMainMenu();
    await this.page.locator('text="Create account"').click();
    await this.page
      .locator('.new-account-create-form__input')
      .fill(accountName);
    await this.page.locator('text=Create').click();
  }

  async checkAccountName(accountName: string) {
    await expect(this.page.locator('.selected-account__name')).toContainText(
      accountName,
    );

    await this.page.screenshot({
      path: `test/playwright/test-results/visual/extension-account-name.main.png`,
      fullPage: true,
    });
  }

  async errorClickButton(buttonText: string) {
    await this.page
      .locator(`button[role="button"]:has-text("${buttonText}")`)
      .click();
  }

  async checkErrorMessages(errorMessage: string[]) {
    await expect(this.page.locator('.box >> h4')).toBeVisible();
    await this.page.screenshot({
      path: `test/playwright/test-results/visual/extension-error-${errorMessage[0].replace(
        // eslint-disable-next-line require-unicode-regexp
        / /g,
        '-',
      )}.main.png`,
      fullPage: true,
    });

    for (const message of errorMessage) {
      await expect(this.page.locator(`text="${message}"`)).toBeVisible();
    }
  }
}

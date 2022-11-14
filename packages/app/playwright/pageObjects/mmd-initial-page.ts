import { expect, Locator, Page } from '@playwright/test';

export class MMDInitialPage {
  readonly page: Page;

  readonly activityTab: Locator;

  constructor(page: Page) {
    this.page = page;

    this.activityTab = page.locator('button:has-text("Activity")');
  }

  async closeWhatsNewBanner() {
    await this.page.locator('data-testid=popover-close').click();
  }

  async closeHelpUsImproveBanner() {
    await this.page.locator('button:has-text("I agree")').click();
  }

  async bringToFront() {
    await this.page.bringToFront();
  }

  async openActivityTab() {
    await this.activityTab.click();
  }

  async checkLastTransactionStatus(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    await expect(
      this.page.locator('.transaction-list-item >> nth=0 >> .list-item__title'),
    ).toHaveText(status);
  }

  async checkLastTransactionCSS(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    expect(
      this.page.locator(
        `.transaction-list-item >> nth=0 >> transaction-status--${status}`,
      ),
    ).toBeVisible();
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
      .locator(`.wallet-overview__buttons >> text=${action}`)
      .click();
  }

  async cancelSend() {
    await this.page.locator('text=cancel').click();
  }

  async hasFunds() {
    const funds = await this.page.locator('.currency-display-component__text');
    expect(funds).not.toEqual('0');
  }

  async sendFunds(account: string) {
    await this.page.locator('data-testid=ens-input').type(`${account}`);
    await this.page.locator('text="Next"').click();
    await this.page.locator('text="Confirm"').click();
  }
}

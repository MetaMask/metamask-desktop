import { Locator, Page } from '@playwright/test';

export class ExtensionMainMenuPage {
  readonly page: Page;

  readonly mainMenuBtn: Locator;

  readonly connectCustodianBtn: Locator;

  readonly tokenTxt: Locator;

  readonly connectCustodianConfirmBtn: Locator;

  readonly connectAccountBtn: Locator;

  readonly closeAddAccountBtn: Locator;

  readonly activityTab: Locator;

  readonly closeSettingsBtn: Locator;

  lockBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuBtn = page.locator('.account-menu__icon');
    this.connectCustodianBtn = page.locator('text=Connect Custodial Account');
    this.tokenTxt = page.locator('textarea#jwt-box');
    this.connectCustodianConfirmBtn = page.locator(
      'button:has-text("Connect")',
    );
    this.connectAccountBtn = page.locator('button:has-text("Connect")');
    this.closeAddAccountBtn = page.locator('button:has-text("Close")');
    this.activityTab = page.locator('button:has-text("Activity")');
    this.closeSettingsBtn = page.locator(
      '.settings-page__header__title-container__close-button',
    );
    this.lockBtn = page.locator('button:has-text("Lock")');
  }

  async open() {
    await this.mainMenuBtn.click();
  }

  async connectCustodian(custodian: string, token: string, accounts: string[]) {
    await this.connectCustodianBtn.click();

    const row = await this.page
      .locator('li')
      .filter({ has: this.page.locator(`"${custodian}"`) });
    await row.locator('data-testid=custody-connect-button').click();

    await this.tokenTxt.type(token);
    await this.connectCustodianConfirmBtn.click();

    for (const [, account] of accounts.entries()) {
      await this.page.locator(`text=${account} >> nth=1`).click();
    }
    await this.connectAccountBtn.click();
    await this.closeAddAccountBtn.click();
  }

  async selectCustodyAccount(account: string) {
    await this.open();
    await this.page.locator(`text=${account} >> nth=1`).click();
  }

  async selectSettings() {
    await this.open();
    await this.page.locator('.account-menu__item >> text=Settings').click();
  }

  async selectSettingsOption(option: string) {
    await this.page.locator(`button >> text=${option}`).click();
  }

  async importAccount(privateKey: string) {
    await this.page.locator('#private-key-box').type(privateKey);
    await this.page.locator('button >> text=Import').click();
  }

  async selectSettingsAdvance() {
    await this.page.locator('button >> text=Advance').click();
  }

  async showTestNetworkOn() {
    await this.page
      .locator(
        'text=Show test networksSelect this to show test networks in network listOffOn >> label',
      )
      .click();
  }

  async showIncomingTransactionsOff() {
    await this.page.locator('text=Security & Privacy').click();
    await this.page
      .locator(
        '.settings-page__content-row >> :scope:has-text("Show Incoming Transactions") >> .toggle-button--on',
      )
      .click();
  }

  async enableEnhancedGasFeeUI() {
    await this.page.locator('text=Experimental').click();
    await this.page
      .locator(
        '.settings-page__content-row >> :scope:has-text("Enable Enhanced Gas Fee UI") >> .toggle-button--off',
      )
      .click();
  }

  async enableOption(option: string) {
    await this.page.locator('text=Experimental').click();
    await this.page
      .locator(
        `.settings-page__content-row >> :scope:has-text("${option}") >> .toggle-button--off`,
      )
      .click();
  }

  async enableDesktopApp() {
    await this.page.locator('text=Experimental').click();
    await this.page.locator('text=Enable desktop app').click();
    const optKey = await this.page
      .locator(':nth-match(.desktop-pairing, 2) >> :nth-match(p, 1)')
      .innerText();
    await this.page.locator('text=Done').click();
    return optKey;
  }

  async closeSettings() {
    await this.closeSettingsBtn.click();
  }

  async reload() {
    await this.page.reload();
  }

  async lock() {
    await this.open();
    await this.lockBtn.click();
  }
}

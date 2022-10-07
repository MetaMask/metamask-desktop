import { Locator, Page } from '@playwright/test';

export class MMISignInPage {
  readonly page: Page;

  readonly extensionId: string;

  readonly getStartedBtn: Locator;

  readonly importWalletBtn: Locator;

  readonly agreeBtn: Locator;

  readonly passwordTxt: Locator;

  readonly passwordConfirmTxt: Locator;

  readonly agreeCheck: Locator;

  readonly importBtn: Locator;

  readonly doneBtn: Locator;

  readonly unlockBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordTxt = page.locator('input#password');
    this.unlockBtn = page.locator('button:has-text("Unlock")');
  }

  async signIn() {
    await this.passwordTxt.type(process.env.MMI_PASSWORD as string);
    await this.unlockBtn.click();
  }
}

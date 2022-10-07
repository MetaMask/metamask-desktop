import { Locator, Page } from '@playwright/test';

export class MMISignUpPage {
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

  constructor(page: Page, extensionId: string) {
    this.page = page;
    this.extensionId = extensionId;
    this.getStartedBtn = page.locator('button:has-text("Get started")');
    this.importWalletBtn = page.locator('button:has-text("Import wallet")');
    this.agreeBtn = page.locator('button:has-text("I agree")');
    this.passwordTxt = page.locator('input#password');
    this.passwordConfirmTxt = page.locator('input#confirm-password');
    this.agreeCheck = page.locator(
      'data-testid=create-new-vault__terms-checkbox',
    );
    this.importBtn = page.locator('button:has-text("Import")');
    this.doneBtn = page.locator('button:has-text("All Done")');
    this.unlockBtn = page.locator('button:has-text("Unlock")');
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
    this.page.locator('button:has-text("I accept the risks")').click();
  }

  async start() {
    await this.importWalletBtn.click();
  }

  async authentication() {
    const seeds = process.env.SEED_PHRASE?.trim().split(/\s+/u);
    for (const [index, element] of (seeds as string[]).entries()) {
      await this.page
        .locator(`data-testid=import-srp__srp-word-${index}`)
        .type(element);
    }
    await this.passwordTxt.type(process.env.MMI_PASSWORD as string);
    await this.passwordConfirmTxt.type(process.env.MMI_PASSWORD as string);
  }

  async termsAndConditions() {
    await this.agreeCheck.click();
    await this.importBtn.click();
    await this.doneBtn.click();
  }
}

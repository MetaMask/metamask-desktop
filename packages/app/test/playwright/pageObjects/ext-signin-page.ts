import { Locator, Page } from '@playwright/test';
import { MMD_PASSWORD } from '../helpers/constants';

export class ExtensionSignInPage {
  readonly page: Page;

  readonly extensionId: string;

  readonly passwordTxt: Locator;

  readonly unlockBtn: Locator;

  constructor(page: Page, extensionId: string) {
    this.page = page;
    this.extensionId = extensionId;
    this.passwordTxt = page.locator('input#password');
    this.unlockBtn = page.locator('button:has-text("Unlock")');
  }

  async goto() {
    await this.page.goto(
      `chrome-extension://${this.extensionId}/home.html#unlock`,
    );
  }

  async signIn() {
    await this.goto();
    await this.passwordTxt.type(MMD_PASSWORD);
    await this.unlockBtn.click();
  }
}

export async function signInFlow(page: Page, extensionId: string) {
  const signIn = new ExtensionSignInPage(page, extensionId);
  await signIn.signIn();
}

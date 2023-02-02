import { Locator, Page, BrowserContext } from '@playwright/test';
import { MMD_PASSWORD, SEED_PHRASE } from '../helpers/constants';
import { ChromeExtensionPage } from './ext-chrome-extension-page';

export class ExtensionSignUpPage {
  readonly page: Page;

  readonly extensionId: string;

  readonly getStartedBtn: Locator;

  readonly importWalletBtn: Locator;

  readonly agreeBtn: Locator;

  readonly noThanksBtn: Locator;

  readonly passwordTxt: Locator;

  readonly passwordConfirmTxt: Locator;

  readonly agreeCheck: Locator;

  readonly importBtn: Locator;

  readonly doneBtn: Locator;

  readonly unlockBtn: Locator;

  readonly confirmSecretBtn: Locator;

  readonly importMyWalletBtn: Locator;

  readonly nextBtn: Locator;

  readonly gotItBtn: Locator;

  constructor(page: Page, extensionId: string) {
    this.page = page;
    this.extensionId = extensionId;
    this.getStartedBtn = page.locator('button:has-text("Get started")');
    this.importWalletBtn = page.locator(
      'button:has-text("Import an existing wallet")',
    );

    this.confirmSecretBtn = page.locator(
      'button:has-text("Confirm Secret Recovery Phrase")',
    );
    this.agreeBtn = page.locator('button:has-text("I agree")');
    this.noThanksBtn = page.locator('button:has-text("No thanks")');
    this.passwordTxt = page.locator('data-testid=create-password-new');
    this.passwordConfirmTxt = page.locator(
      'data-testid=create-password-confirm',
    );

    this.agreeCheck = page.locator('data-testid=create-password-terms');
    this.importBtn = page.locator('button:has-text("Import")');
    this.importMyWalletBtn = page.locator(
      'button:has-text("Import my wallet")',
    );
    this.doneBtn = page.locator('button:has-text("Done")');
    this.unlockBtn = page.locator('button:has-text("Unlock")');

    this.nextBtn = page.locator('button:has-text("Next")');
    this.gotItBtn = page.locator('button:has-text("Got it!")');
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
  }

  async start() {
    await this.importWalletBtn.click();
    await this.noThanksBtn.click();
  }

  async authentication() {
    const seeds = SEED_PHRASE.trim().split(/\s+/u);
    for (const [index, element] of (seeds as string[]).entries()) {
      await this.page
        .locator(`data-testid=import-srp__srp-word-${index}`)
        .type(element);
    }
    await this.confirmSecretBtn.click();
    await this.passwordTxt.type(MMD_PASSWORD);
    await this.passwordConfirmTxt.type(MMD_PASSWORD);
    await this.agreeCheck.click();
    await this.importMyWalletBtn.click();
  }

  async completed() {
    await this.gotItBtn.click();
    await this.nextBtn.click();
    await this.doneBtn.click();
  }
}

export async function signUpFlow(page: Page, context: BrowserContext) {
  // Getting extension id of Extension
  const extensions = new ChromeExtensionPage(await context.newPage());
  await extensions.goto();
  await extensions.setDevMode();
  const extensionId = await extensions.getExtensionId();
  await extensions.close();

  const signUp = new ExtensionSignUpPage(page, extensionId as string);
  await signUp.goto();
  await signUp.start();
  await signUp.authentication();
  await signUp.completed();
  return extensionId;
}

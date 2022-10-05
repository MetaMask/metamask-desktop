import { Context } from 'vm';
import { expect, Locator, Page } from '@playwright/test';

export class DummyAppPage {
  readonly page: Page;

  readonly connectBtn: Locator;

  readonly signTypedDataV4ResultText: Locator;

  readonly getBtnById: (text: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectBtn = page.locator('button:has-text("Connect")');
    this.signTypedDataV4ResultText = page.locator('#signTypedDataV4Result');

    this.getBtnById = (id: string) => page.locator(`#${id}`);
  }

  async goto() {
    await this.page.goto(
      'https://consensys.gitlab.io/codefi/products/mmi/test-dapp/',
    );
  }

  async connectMMI(context: Context) {
    const [popup1] = await Promise.all([
      context.waitForEvent('page'),
      this.connectBtn.click(),
    ]);
    await popup1.waitForLoadState();
    // Check which account is selected and select if required
    // await popup1.locator('text=Custody Ac... (0x8b2...b3ad)').click()
    await popup1.locator('button:has-text("Next")').click();
    await popup1.locator('button:has-text("Connect")').click();
    await popup1.close();
  }

  async callTestDappButton(
    context: Context,
    buttonId: string,
    isSign: boolean | undefined,
    signedTransactionTime: string,
  ) {
    if (isSign) {
      await this.page.fill('#signTypedContentsId', signedTransactionTime);
    }

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      this.getBtnById(buttonId).click(),
    ]);
    await popup.waitForLoadState();

    if (isSign) {
      await popup.click('button:has-text("Sign")');
    } else {
      await popup.waitForSelector('button:has-text("Confirm")');
      await popup.click('button:has-text("Confirm")', { clickCount: 5 });
      await popup.click('button:has-text("Approve")');
    }

    await popup.close();
  }

  async returnsSignTypedDataV4Result() {
    await expect(this.signTypedDataV4ResultText).toHaveText(/0x[0-9a-f]+/u);
  }
}

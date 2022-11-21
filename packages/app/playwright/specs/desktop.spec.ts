import { Page, BrowserContext } from '@playwright/test';

import { _electron as electron } from 'playwright';
import test from '../helpers/setup';
import { ChromeExtensionPage } from '../pageObjects/mmd-extension-page';
import { MMDMainMenuPage } from '../pageObjects/mmd-mainMenu-page';
import { MMDSignUpPage } from '../pageObjects/mmd-signup-page';
import { MMDSignInPage } from '../pageObjects/mmd-signin-page';
import { MMDInitialPage } from '../pageObjects/mmd-initial-page';

async function signUpFlow(page: Page, context: BrowserContext) {
  // Getting extension id of MMD
  const extensions = new ChromeExtensionPage(await context.newPage());
  await extensions.goto();
  await extensions.setDevMode();
  const extensionId = await extensions.getExtensionId();
  await extensions.close();

  const signUp = new MMDSignUpPage(page, extensionId as string);
  await signUp.goto();
  await signUp.start();
  await signUp.authentication();
  await signUp.termsAndConditions();
  return extensionId;
}

const enableDesktopAppFlow = async (page: Page) => {
  // Setup testnetwork in settings
  const mainMenuPage = new MMDMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.selectSettingsAdvance();
  await mainMenuPage.showTestNetworkOn();
  await mainMenuPage.showIncomingTransactionsOff();
  await mainMenuPage.enableDesktopApp();
};

test.describe('Desktop send', () => {
  test('Desktop: Send a transaction from one account to another', async ({
    page,
    context,
  }) => {
    const electronApp = await electron.launch({
      args: [process.env.ELECTRON_APP_PATH as string],
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    electronApp
      .process()
      .stdout!.on('data', (data) => console.log(`stdout: ${data}`));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    electronApp
      .process()
      .stderr!.on(
        'data',
        (error) =>
          console.log`stderr: ${Buffer.from(error, 'utf-8').toString('utf-8')}`,
      );

    const windows = electronApp.windows();
    console.log(`${windows.length} windows created`);
    const main =
      (await windows[0].title()) === 'MetaMask Desktop'
        ? windows[0]
        : windows[1];
    console.log(`${await main.title()} -> main window`);
    // await expect(main.locator('.mmd-pair-status')).toContainText('Inactive');
    await main.screenshot({
      path: 'test-results/visual/desktop-inactive.main.png',
    });
    const initialFlow = await context.newPage();
    const extensionId = await signUpFlow(initialFlow, context);
    await enableDesktopAppFlow(initialFlow);

    const signIn = new MMDSignInPage(page, extensionId as string);
    await signIn.signIn();
    await main.screenshot({
      path: 'test-results/visual/desktop-active.main.png',
    });
    // await expect(main.locator('.mmd-pair-status')).toContainText('Active');

    const initialPage = new MMDInitialPage(page);
    await initialPage.hasDesktopEnabled();

    // await initialPage.closeHelpUsImproveBanner();


    await initialPage.hasFunds();
    await initialPage.selectMainAction('Send');
    await initialPage.sendFunds('0x2f318c334780961fb129d2a6c30d0763d9a5c970');
    await initialPage.checkLastTransactionAction('Send');
    await initialPage.checkLastTransactionStatus('pending');

    // Get date in format "Month Day" like "Nov 15"
    const date = new Date().toLocaleDateString('en-us', {
      month: 'short',
      day: 'numeric',
    });
    await initialPage.checkLastTransactionStatus(date);

    await electronApp.close();
  });
});

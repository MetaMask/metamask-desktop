import { Page, BrowserContext, expect } from '@playwright/test';
import test from '../helpers/setup';
import { ChromeExtensionPage } from '../pageObjects/mmd-extension-page';
import { MMDMainMenuPage } from '../pageObjects/mmd-mainMenu-page';
import { MMDSignUpPage } from '../pageObjects/mmd-signup-page';
import { MMDSignInPage } from '../pageObjects/mmd-signin-page';
import { MMDInitialPage } from '../pageObjects/mmd-initial-page';

import { electronStartup } from '../helpers/electron';

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

const enableDesktopAppFlow = async (page: Page): Promise<string> => {
  // Setup testnetwork in settings
  const mainMenuPage = new MMDMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.selectSettingsAdvance();
  await mainMenuPage.showTestNetworkOn();
  await mainMenuPage.showIncomingTransactionsOff();
  return await mainMenuPage.enableDesktopApp();
};

test.describe('Desktop OTP pairing', () => {
  test('Desktop: successfull OTP pairing', async ({ page, context }) => {
    const electronApp = await electronStartup();

    // Finding the window like this as innerText seems not working as expected.
    const windows = electronApp.windows();
    const windowTitles = await Promise.all(windows.map((x) => x.title()));
    const windowIndex = windowTitles.findIndex((x) => x === 'MetaMask Desktop');
    const mainWindow = windows[windowIndex];

    await mainWindow.screenshot({
      path: 'test/playwright/test-results/visual/desktop-inactive.main.png',
      fullPage: true,
    });

    console.log(`Main window title: ${await mainWindow.title()}`);

    const initialFlow = await context.newPage();
    const extensionId = await signUpFlow(initialFlow, context);
    const optPairingKey = await enableDesktopAppFlow(initialFlow);

    // Input the opt pairing key
    for (const [index, element] of optPairingKey.split('').entries()) {
      if (index === 0) {
        await mainWindow
          .locator('[aria-label="Please enter verification code. Digit 1"]')
          .type(element);
      } else {
        await mainWindow
          .locator(`[aria-label="Digit ${index + 1}"]`)
          .type(element);
      }
    }

    //
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await mainWindow.screenshot({
      path: 'test/playwright/test-results/visual/desktop-all-set.main.png',
      fullPage: true,
    });

    const signIn = new MMDSignInPage(page, extensionId as string);
    await signIn.signIn();

    await mainWindow.locator('text=Go to Settings').click();
    await mainWindow.screenshot({
      path: 'test/playwright/test-results/visual/desktop-active.main.png',
      fullPage: true,
    });

    await expect(mainWindow.locator('.mmd-pair-status')).toContainText(
      'Active',
    );

    const initialPage = new MMDInitialPage(page);
    await initialPage.hasDesktopEnabled();

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
    await page.screenshot({
      path: 'test/playwright/test-results/visual/extension-error-desktop-disconnected.main.png',
      fullPage: true,
    });
  });
});

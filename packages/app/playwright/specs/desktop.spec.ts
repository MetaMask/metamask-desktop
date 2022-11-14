import { Page, BrowserContext, expect } from '@playwright/test';

import { _electron as electron } from 'playwright';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmd-extension-page';
import { MMDMainMenuPage } from '../pageObjects/mmd-mainMenu-page';
import { MMDNetworkPage } from '../pageObjects/mmd-network-page';
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
  test('Goerli: Send a transaction from one account to another', async ({
    page,
    context,
  }) => {
    const electronApp = await electron.launch({
      args: [process.env.ELECTRON_APP_PATH as string],
    });
    const electronPage = await electronApp.firstWindow();
    // await expect(electronPage.locator('.mmd-pair-status')).toContainText(
    //   'Inactive',
    // );
    const initialFlow = await context.newPage();
    const extensionId = await signUpFlow(initialFlow, context);
    await enableDesktopAppFlow(initialFlow);

    const signIn = new MMDSignInPage(page, extensionId as string);
    await signIn.signIn();
    await expect(electronPage.locator('.mmd-pair-status')).toContainText(
      'Active',
    );

    const initialPage = new MMDInitialPage(page);
    await initialPage.closeHelpUsImproveBanner();

    // Check network
    const networkPage = new MMDNetworkPage(page);
    await networkPage.open();
    await networkPage.selectNetwork('Goerli Test Network');

    await initialPage.hasFunds();
    await initialPage.selectMainAction('Send');
    await initialPage.cancelSend();
    await initialPage.selectMainAction('Send');
    await initialPage.sendFunds('0xd14cdbdb1b72bbe169eb55fda1f368ff51869321');
    await initialPage.checkLastTransactionStatus('Send');

    await electronApp.close();
  });
});

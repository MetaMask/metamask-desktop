import { Page, BrowserContext } from '@playwright/test';
import test from '../helpers/setup';
import { ChromeExtensionPage } from '../pageObjects/ext-chrome-extension-page';
import { ExtensionMainMenuPage } from '../pageObjects/ext-mainMenu-page';
import { ExtensionSignUpPage } from '../pageObjects/ext-signup-page';
import { ExtensionSignInPage } from '../pageObjects/ext-signin-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';

import { electronStartup, getDesktopWindowByName } from '../helpers/electron';
import { DesktopOTPPage } from '../pageObjects/desktop-otp-pairing-page';

async function signUpFlow(page: Page, context: BrowserContext) {
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
  await signUp.termsAndConditions();
  return extensionId;
}

const enableDesktopAppFlow = async (page: Page): Promise<string> => {
  // Setup testnetwork in settings
  const mainMenuPage = new ExtensionMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.selectSettingsAdvance();
  await mainMenuPage.showTestNetworkOn();
  await mainMenuPage.showIncomingTransactionsOff();
  return await mainMenuPage.enableDesktopApp();
};

test.describe('Desktop OTP pairing', () => {
  test('Desktop: successfull OTP pairing', async ({ page, context }) => {
    const electronApp = await electronStartup();

    const mainWindow = await getDesktopWindowByName(
      electronApp,
      'MetaMask Desktop',
    );
    const otpWindow = new DesktopOTPPage(mainWindow);

    await otpWindow.window.screenshot({
      path: 'test/playwright/test-results/visual/desktop-inactive.main.png',
      fullPage: true,
    });

    const initialFlow = await context.newPage();
    const extensionId = await signUpFlow(initialFlow, context);
    const optPairingKey = await enableDesktopAppFlow(initialFlow);

    otpWindow.setOtpPairingKey(optPairingKey);

    const signIn = new ExtensionSignInPage(page, extensionId as string);
    await signIn.signIn();

    otpWindow.checkIsActive();

    const initialPage = new ExtensionInitialPage(page);
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

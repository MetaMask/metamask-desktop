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

test.describe('Desktop State Sync', () => {
  test('Automatic state sync after disconnect desktop', async ({
    page,
    context,
  }) => {
    const newAccountName = 'New Account';
    const electronApp = await electronStartup();

    const mainWindow = await getDesktopWindowByName(
      electronApp,
      'MetaMask Desktop',
    );
    const otpWindow = new DesktopOTPPage(mainWindow);

    const extensionId = await signUpFlow(page, context);
    const optPairingKey = await enableDesktopAppFlow(page);

    await otpWindow.setOtpPairingKey(optPairingKey);

    const connectedFlow = await context.newPage();
    const signIn = new ExtensionSignInPage(
      connectedFlow,
      extensionId as string,
    );
    await signIn.signIn();

    // Check is connected in both sides
    await otpWindow.checkIsActive();
    const initialPage = new ExtensionInitialPage(connectedFlow);
    await initialPage.desktopAppIs('enabled');

    // Create an account
    await initialPage.createAccount(newAccountName);

    // Add a 2secs delay to allow desktop / extension sync
    // 2 secs as desktop / extension debounce changes by 1 sec
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Close desktop
    await electronApp.close();

    // Metamask desktop lost -> Disable metamask desktop
    await initialPage.checkErrorMessages([
      'MetaMask Desktop connection was lost',
      'Please make sure you have the desktop app up and running or disable MetaMask Desktop.',
    ]);
    await initialPage.errorClickButton('Disable MetaMask Desktop');
    // Look and unlock?

    // Check account is still created
    await initialPage.checkAccountName(newAccountName);
  });
});

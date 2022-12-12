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

    const extensionId = await signUpFlow(page, context);
    const optPairingKey = await enableDesktopAppFlow(page);

    await otpWindow.setOtpPairingKey(optPairingKey);

    const connectedFlow = await context.newPage();
    const signIn = new ExtensionSignInPage(
      connectedFlow,
      extensionId as string,
    );
    await signIn.signIn();

    await otpWindow.checkIsActive();
    const initialPage = new ExtensionInitialPage(connectedFlow);
    await initialPage.hasDesktopEnabled();

    await electronApp.close();
  });

  test('Desktop: successfull OTP un-pairing', async ({ page, context }) => {
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
    await otpWindow.checkIsActive();
    const initialPage = new ExtensionInitialPage(connectedFlow);
    await initialPage.desktopAppIs('enabled');
    // Disasble desktop
    await initialPage.disableDesktop();
    await otpWindow.checkIsInactive();

    const disconnectedFlow = await context.newPage();
    const signIn2 = new ExtensionSignInPage(
      disconnectedFlow,
      extensionId as string,
    );
    await signIn2.signIn();
    const initialPage2 = new ExtensionInitialPage(disconnectedFlow);
    await initialPage2.desktopAppIs('disabled');
    await otpWindow.checkIsInactive();
    await electronApp.close();
  });
});

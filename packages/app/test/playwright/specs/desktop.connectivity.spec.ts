import { Page, BrowserContext, expect } from '@playwright/test';
import test from '../helpers/setup';
import { ChromeExtensionPage } from '../pageObjects/ext-chrome-extension-page';
import { ExtensionMainMenuPage } from '../pageObjects/ext-mainMenu-page';
import { ExtensionSignUpPage } from '../pageObjects/ext-signup-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';
import { electronStartup, getDesktopWindowByName } from '../helpers/electron';
import { DesktopOTPPage } from '../pageObjects/desktop-otp-pairing-page';
import { ExtensionSignInPage } from '../pageObjects/ext-signin-page';

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

const enableDesktopAppErrorFlow = async (page: Page) => {
  // Setup testnetwork in settings
  const mainMenuPage = new ExtensionMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.page.locator('text=Experimental').click();
  await mainMenuPage.page.locator('text=Enable desktop app').click();
};

test.describe('Extension / Desktop connectivity issues', () => {
  test('Extension error when desktop not available', async ({
    page,
    context,
  }) => {
    await signUpFlow(page, context);
    await enableDesktopAppErrorFlow(page);

    const initialPage = new ExtensionInitialPage(page);
    await initialPage.checkErrorMessages([
      'MetaMask Desktop was not found',
      'Please make sure you have the desktop app up and running.',
      'If you have no desktop app installed, please download it on the MetaMask website.',
    ]);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      initialPage.errorClickButton('Download MetaMask Desktop'),
    ]);

    expect(newPage.url()).toStrictEqual('https://metamask.io/');
  });

  test('Extension error when desktop close unexpectedly', async ({
    page,
    context,
  }) => {
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

    await initialPage.checkErrorMessages([
      'MetaMask Desktop connection was lost',
      'Please make sure you have the desktop app up and running or disable MetaMask Desktop.',
    ]);

    await initialPage.errorClickButton('Disable MetaMask Desktop');
  });
});

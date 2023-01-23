import { BrowserContext, expect, chromium } from '@playwright/test';
import test, { extensionPath } from '../helpers/setup';
import {
  enableDesktopAppErrorFlow,
  enableDesktopAppFlow,
} from '../pageObjects/ext-mainMenu-page';
import { signUpFlow } from '../pageObjects/ext-signup-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';
import { electronStartup, getDesktopWindowByName } from '../helpers/electron';
import { DesktopOTPPage } from '../pageObjects/desktop-otp-pairing-page';
import { signInFlow } from '../pageObjects/ext-signin-page';
import { delay } from '../helpers/utils';

async function getAnotherBrowserSession(): Promise<BrowserContext> {
  const launchOptions = {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`],
  };
  return await chromium.launchPersistentContext('', launchOptions);
}

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
    await mainWindow.locator('text=No thanks').click();
    const otpWindow = new DesktopOTPPage(mainWindow);

    const extensionId = await signUpFlow(page, context);
    const optPairingKey = await enableDesktopAppFlow(page);

    await otpWindow.setOtpPairingKey(optPairingKey);

    const connectedFlow = await context.newPage();
    await signInFlow(connectedFlow, extensionId as string);

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

  test('Desktop already connected in another extension', async ({
    page,
    context,
  }) => {
    const electronApp = await electronStartup();

    const mainWindow = await getDesktopWindowByName(
      electronApp,
      'MetaMask Desktop',
    );
    await mainWindow.locator('text=No thanks').click();
    const desktopWindow = new DesktopOTPPage(mainWindow);

    // BROWSER SESSION 1 START
    const browserSession1 = page;
    const extensionId = (await signUpFlow(browserSession1, context)) as string;
    let optPairingKey = await enableDesktopAppFlow(browserSession1);
    await desktopWindow.setOtpPairingKey(optPairingKey);
    // Create a new tab to connect to extension again
    const browserSession1Connected = await context.newPage();
    await signInFlow(browserSession1Connected, extensionId);
    await desktopWindow.checkIsActive();
    const browserSession1ConnectedInitial = new ExtensionInitialPage(
      browserSession1Connected,
    );
    await browserSession1ConnectedInitial.hasDesktopEnabled();
    // BROWSER SESSION 1 FINISH

    // BROWSER SESSION 2 START
    const anotherSession = await getAnotherBrowserSession();
    const browserSession2 = await anotherSession.newPage();
    await signUpFlow(browserSession2, anotherSession);
    // Try connecting Desktop app in second session
    await enableDesktopAppErrorFlow(browserSession2);
    const initialPage = new ExtensionInitialPage(browserSession2);
    await initialPage.checkErrorMessages([
      'MM Desktop is already paired',
      'If you want to start a new pairing, please remove the current connection.',
      'Go to Settings in MetaMask Desktop',
    ]);
    await delay(1000);
    await initialPage.errorClickButton('Return to Settings Page');

    // This two lines disconnect session 1
    await desktopWindow.removeConnection();
    await desktopWindow.pairWithMetamask();

    // Pair session 2
    optPairingKey = await enableDesktopAppFlow(browserSession2);
    await desktopWindow.setOtpPairingKey(optPairingKey);

    const browserSession2Connected = await anotherSession.newPage();
    await signInFlow(browserSession2Connected, extensionId);
    await desktopWindow.checkIsActive();
    const browserSession2ConnectedInitial = new ExtensionInitialPage(
      browserSession2Connected,
    );
    await browserSession2ConnectedInitial.hasDesktopEnabled();

    await electronApp.close();
  });
});

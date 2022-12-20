import test from '../helpers/setup';
import { enableDesktopAppFlow } from '../pageObjects/ext-mainMenu-page';
import { signUpFlow } from '../pageObjects/ext-signup-page';
import { ExtensionSignInPage } from '../pageObjects/ext-signin-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';

import { electronStartup, getDesktopWindowByName } from '../helpers/electron';
import { DesktopOTPPage } from '../pageObjects/desktop-otp-pairing-page';

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

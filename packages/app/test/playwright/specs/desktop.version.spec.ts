import { Page, BrowserContext } from '@playwright/test';
import test from '../helpers/setup';
import { ChromeExtensionPage } from '../pageObjects/ext-chrome-extension-page';
import { ExtensionMainMenuPage } from '../pageObjects/ext-mainMenu-page';
import { ExtensionSignUpPage } from '../pageObjects/ext-signup-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';

import { electronStartup } from '../helpers/electron';

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

const enableDesktopAppErrorFlow = async (page: Page) => {
  // Setup testnetwork in settings
  const mainMenuPage = new ExtensionMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.page.locator('text=Experimental').click();
  await mainMenuPage.page.locator('text=Enable desktop app').click();
};

test.describe('Desktop Compatibility Version', () => {
  test('Desktop app upgrade required', async ({ page, context }) => {
    const env = { COMPATIBILITY_VERSION_DESKTOP_TEST: '0' };
    const electronApp = await electronStartup(env);

    await signUpFlow(page, context);
    await enableDesktopAppErrorFlow(page);

    const initialPage = new ExtensionInitialPage(page);
    await initialPage.checkErrorMessages([
      'MetaMask Desktop is outdated',
      'Your MetaMask desktop app needs to be upgraded.',
      'Update MetaMask Desktop',
    ]);
    await electronApp.close();
  });

  test('Extension upgrade required', async ({ page, context }) => {
    const env = { COMPATIBILITY_VERSION_DESKTOP_TEST: '100' };
    const electronApp = await electronStartup(env);

    await signUpFlow(page, context);
    await enableDesktopAppErrorFlow(page);

    const initialPage = new ExtensionInitialPage(page);
    await initialPage.checkErrorMessages([
      'MetaMask Extension is outdated',
      'Your MetaMask extension needs to be upgraded.',
      'Update MetaMask Extension',
    ]);
    await electronApp.close();
  });
});

import { Page } from '@playwright/test';
import test from '../helpers/setup';
import { ExtensionMainMenuPage } from '../pageObjects/ext-mainMenu-page';
import { signUpFlow } from '../pageObjects/ext-signup-page';
import { ExtensionInitialPage } from '../pageObjects/ext-initial-page';

import { electronStartup } from '../helpers/electron';

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
    console.log(electronStartup);
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

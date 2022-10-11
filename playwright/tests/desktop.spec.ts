import { Page, BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMISignInPage } from '../pageObjects/mmi-signin-page';
import { MMIInitialPage } from '../pageObjects/mmi-initial-page';

const signUpFlow = async (page: Page, context: BrowserContext) => {
  // Getting extension id of MMI
  const extensions = new ChromeExtensionPage(await context.newPage());
  await extensions.goto();
  await extensions.setDevMode();
  const extensionId = await extensions.getExtensionId();
  await extensions.close();

  const signUp = new MMISignUpPage(page, extensionId as string);
  await signUp.goto();
  await signUp.start();
  await signUp.authentication();
  await signUp.termsAndConditions();
};

const enableDesktopAppFlow = async (page: Page) => {
  // Setup testnetwork in settings
  const mainMenuPage = new MMIMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.selectSettingsAdvance();
  await mainMenuPage.showTestNetworkOn();
  await mainMenuPage.showIncomingTransactionsOff();
  await mainMenuPage.enableOption('Enable desktop app');
  await mainMenuPage.closeSettings();
  await mainMenuPage.lock();
};

test.describe('Desktop send', () => {
  test('Goerli: Send a transaction from one account to another', async ({
    page,
    context,
  }) => {
    await signUpFlow(page, context);
    await enableDesktopAppFlow(page);
    const signIn = new MMISignInPage(page);
    await signIn.signIn();

    const initialPage = new MMIInitialPage(page);
    await initialPage.closeHelpUsImproveBanner();

    // Check network
    const networkPage = new MMINetworkPage(page);
    await networkPage.open();
    await networkPage.selectNetwork('Goerli Test Network');

    await initialPage.hasFunds();
    await initialPage.selectMainAction('Send');
    await initialPage.cancelSend();
    await initialPage.selectMainAction('Send');
    await initialPage.sendFunds('0xd14cdbdb1b72bbe169eb55fda1f368ff51869321');
    await initialPage.checkLastTransactionStatus('Send');
  });

  test('Localhost: Send a transaction from one account to another', async ({
    page,
    context,
  }) => {
    await signUpFlow(page, context);

    // Enable testnets
    const mainMenuPage = new MMIMainMenuPage(page);
    await mainMenuPage.selectSettings();
    await mainMenuPage.selectSettingsAdvance();
    await mainMenuPage.showTestNetworkOn();

    // Check network
    const networkPage = new MMINetworkPage(page);
    await networkPage.open();
    await networkPage.selectNetwork('Localhost');

    // import account
    await mainMenuPage.open();
    await mainMenuPage.selectSettingsOption('Import account');
    await mainMenuPage.importAccount(
      '0x14b505cf14fd51f420eecad6b2da415742e172b6097150dd25b110654631822a',
    );
    // ganache-cli --account '0x14b505cf14fd51f420eecad6b2da415742e172b6097150dd25b110654631822a,100000000000000000000'

    // Enable desktop
    await enableDesktopAppFlow(page);
    const signIn = new MMISignInPage(page);
    await signIn.signIn();

    // Send funds
    const initialPage = new MMIInitialPage(page);
    await initialPage.closeHelpUsImproveBanner();
    await initialPage.hasFunds();
    await initialPage.selectMainAction('Send');
    await initialPage.cancelSend();
    await initialPage.selectMainAction('Send');
    await initialPage.sendFunds('0xd14cdbdb1b72bbe169eb55fda1f368ff51869321');
    await initialPage.checkLastTransactionStatus('Send');
  });
});

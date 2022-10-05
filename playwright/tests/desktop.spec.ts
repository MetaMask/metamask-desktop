import { Page, BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMIInitialPage } from '../pageObjects/mmi-initial-page';

const initialSetup = async (page: Page, context: BrowserContext) => {
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

  const initialPage = new MMIInitialPage(page);
  // await initialPage.closeWhatsNewBanner();

  // Setup testnetwork in settings
  const mainMenuPage = new MMIMainMenuPage(page);
  await mainMenuPage.selectSettings();
  await mainMenuPage.selectSettingsAdvance();
  await mainMenuPage.showTestNetworkOn();
  await mainMenuPage.showIncomingTransactionsOff();
  // await mainMenuPage.enableOption('Enable Enhanced Gas Fee UI');
  await mainMenuPage.enableOption('Enable desktop app');
  await mainMenuPage.closeSettings();
  await mainMenuPage.reload();


};

test.describe('MMI send', () => {
  test('Send a transaction from one account to another and confirm it from custody', async ({
    page,
    context,
  }) => {
    await initialSetup(page, context);

    

      // Check network
    const networkPage = new MMINetworkPage(page);
    await networkPage.open();
    await networkPage.selectNetwork('Goerli Test Network');

    const initialPage = new MMIInitialPage(page);
    await initialPage.hasFunds();
    await initialPage.selectMainAction('Send');
    await initialPage.cancelSend();
    await initialPage.selectMainAction('Send');
    await initialPage.sendFunds(
      '0xd14cdbdb1b72bbe169eb55fda1f368ff51869321',
      '0',
    );
    // await initialPage.checkLastTransactionStatus('Send');
    await initialPage.checkLastTransactionStatus('Send');

  });
});

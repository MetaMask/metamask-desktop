/**
 * @file The entry point for the web extension singleton process.
 */

import browser from 'webextension-polyfill';
import { initialize } from './generic-background';
import LocalStore from './lib/local-store';
import ExtensionPlatform from './platforms/extension';
import NotificationManager from './lib/notification-manager';
/* eslint-enable import/first */

const localStore = new LocalStore();
const platform = new ExtensionPlatform();

const notificationManager = new NotificationManager();

initialize({ localStore, triggerUi, openPopup, browser, platform, notificationManager }).catch(log.error);

//
// Etc...
//

/**
 * Opens the browser popup for user confirmation
 */
 async function triggerUi() {
  const tabs = await platform.getActiveTabs();
  const currentlyActiveMetamaskTab = Boolean(
      tabs.find((tab) => openMetamaskTabsIDs[tab.id]),
  );
  // Vivaldi is not closing port connection on popup close, so popupIsOpen does not work correctly
  // To be reviewed in the future if this behaviour is fixed - also the way we determine isVivaldi variable might change at some point
  const isVivaldi =
      tabs.length > 0 &&
      tabs[0].extData &&
      tabs[0].extData.indexOf('vivaldi_tab') > -1;
  if (
      !uiIsTriggering &&
      (isVivaldi || !popupIsOpen) &&
      !currentlyActiveMetamaskTab
  ) {
      uiIsTriggering = true;
      try {
          await notificationManager.showPopup();
      } finally {
          uiIsTriggering = false;
      }
  }
}

/**
* Opens the browser popup for user confirmation of watchAsset
* then it waits until user interact with the UI
*/
async function openPopup() {
  await triggerUi();
  await new Promise((resolve) => {
      const interval = setInterval(() => {
          if (!notificationIsOpen) {
              clearInterval(interval);
              resolve();
          }
      }, SECOND);
  });
}


// On first install, open a new tab with MetaMask
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (
    reason === 'install' &&
    !(process.env.METAMASK_DEBUG || process.env.IN_TEST)
  ) {
    platform.openExtensionInBrowser();
  }
});

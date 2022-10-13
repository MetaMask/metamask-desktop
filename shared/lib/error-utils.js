import { memoize } from 'lodash';
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../../ui/helpers/utils/i18n-helper';
import { renderDesktopErrorContent } from '../../ui/pages/desktop-error/desktop-error.component';
import { EXTENSION_ERROR_PAGE_TYPES } from '../constants/desktop';
import { browser } from '../../app/scripts/desktop/browser/browser-polyfill';
import switchDirection from './switch-direction';

const _setupLocale = async (currentLocale) => {
  const currentLocaleMessages = currentLocale
    ? await fetchLocale(currentLocale)
    : {};
  const enLocaleMessages = await fetchLocale('en');

  await loadRelativeTimeFormatLocaleData('en');
  if (currentLocale) {
    await loadRelativeTimeFormatLocaleData(currentLocale);
  }

  return { currentLocaleMessages, enLocaleMessages };
};

function disableDesktop(backgroundConnection) {
  backgroundConnection.disableDesktopError();
}

export function downloadDesktopApp() {
  global.platform.openTab({ url: 'https://metamask.io/' });
}

export function downloadExtension() {
  global.platform.openTab({ url: 'https://metamask.io/' });
}

export function restartExtension() {
  browser.runtime.reload();
}

export const setupLocale = memoize(_setupLocale);

const getLocaleContext = (currentLocaleMessages, enLocaleMessages) => {
  return (key) => {
    let message = currentLocaleMessages[key]?.message;
    if (!message && enLocaleMessages[key]) {
      message = enLocaleMessages[key].message;
    }
    return message;
  };
};

export async function getErrorHtml(supportLink, metamaskState, err) {
  let response, preferredLocale;
  if (metamaskState?.currentLocale) {
    preferredLocale = metamaskState.currentLocale;
    response = await setupLocale(metamaskState.currentLocale);
  } else {
    preferredLocale = await getFirstPreferredLangCode();
    response = await setupLocale(preferredLocale);
  }

  const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(preferredLocale)
    ? 'rtl'
    : 'auto';

  switchDirection(textDirection);
  const { currentLocaleMessages, enLocaleMessages } = response;
  const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);
  const desktopEnabled = metamaskState?.desktopEnabled === true;

  if (desktopEnabled) {
    let errorType = EXTENSION_ERROR_PAGE_TYPES.CRITICAL_ERROR;

    if (err?.message.includes('No response from RPC')) {
      errorType = EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND;
    }

    return renderDesktopErrorContent({
      type: errorType,
      t,
      isHtmlError: true,
    });
  }

  return `
    <div class="critical-error">
      <div class="critical-error__alert">
        <p class="critical-error__alert__message">
          ${t('troubleStarting')}
        </p>
        <button id='critical-error-button' class="critical-error__alert__button">
          ${t('restartMetamask')}
        </button>
      </div>
      <p class="critical-error__paragraph">
        ${t('stillGettingMessage')}
        <a
          href=${supportLink}
          class="critical-error__paragraph__link"
          target="_blank"
          rel="noopener noreferrer">
            ${t('sendBugReport')}
          </a>
      </p>
    </div>
    `;
}

export function registerDesktopErrorActions(backgroundConnection) {
  const disableDesktopButton = document.getElementById(
    'desktop-error-button-disable-mmd',
  );
  const restartMMButton = document.getElementById(
    'desktop-error-button-restart-mm',
  );
  const downloadMMDButton = document.getElementById(
    'desktop-error-button-download-mmd',
  );

  disableDesktopButton?.addEventListener('click', (_) => {
    disableDesktop(backgroundConnection);
  });

  restartMMButton?.addEventListener('click', (_) => {
    restartExtension();
  });

  downloadMMDButton?.addEventListener('click', (_) => {
    downloadDesktopApp();
  });
}

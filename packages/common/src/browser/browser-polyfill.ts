import { Browser } from '../types/browser';

// eslint-disable-next-line import/no-mutable-exports
let browser: Browser;

export const initBrowser = ({
  initialBrowser,
}: {
  initialBrowser: Browser;
}) => {
  if (browser) {
    return;
  }

  browser = initialBrowser;
};

export const isBrowserInitialised = () => {
  return Boolean(browser);
};

export { browser };

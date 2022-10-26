import { Browser } from '../types/browser';

// eslint-disable-next-line import/no-mutable-exports
let browser: Browser;

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
// eslint-disable-next-line import/first
import { browser as NodeBrowser } from './node-browser';

browser = NodeBrowser;
///: END:ONLY_INCLUDE_IN

///: BEGIN:EXCLUDE_IN(desktopapp)
// eslint-disable-next-line import/first, import/order
import WebExtensionPolyfill from 'webextension-polyfill';

browser = WebExtensionPolyfill as any;
///: END:EXCLUDE_IN

export { browser };

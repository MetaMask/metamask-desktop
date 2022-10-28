import { Browser } from '../types/browser';

// eslint-disable-next-line import/no-mutable-exports
let browser: Browser;

///: BEGIN:EXCLUDE_IN(desktopapp)
// eslint-disable-next-line
// @ts-ignore
// eslint-disable-next-line
import WebExtensionPolyfill from 'webextension-polyfill';

browser = WebExtensionPolyfill as any;
///: END:EXCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
// eslint-disable-next-line
browser ||= require('./node-browser').browser;
///: END:ONLY_INCLUDE_IN

export { browser };

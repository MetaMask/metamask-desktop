import { Duplex } from 'stream';
import { Browser } from '../types/browser';

/* eslint-disable import/no-mutable-exports */
let browser: Browser;
let registerRequestStream: (stream: Duplex) => void;
let unregisterRequestStream: () => void;
/* eslint-enable import/no-mutable-exports */

///: BEGIN:EXCLUDE_IN(desktopapp)
// eslint-disable-next-line
// @ts-ignore
// eslint-disable-next-line
import WebExtensionPolyfill from 'webextension-polyfill';

browser = WebExtensionPolyfill as any;
///: END:EXCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
if (!browser) {
  // eslint-disable-next-line
  const NodeBrowser = require('./node-browser');
  ({ browser, registerRequestStream, unregisterRequestStream } = NodeBrowser);
}

///: END:ONLY_INCLUDE_IN

export { browser, registerRequestStream, unregisterRequestStream };

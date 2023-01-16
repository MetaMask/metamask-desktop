import 'global-agent/bootstrap';
import './logger-init';
import '../browser/browser-init';
import { webcrypto } from 'node:crypto';
import { Headers } from 'node-fetch';
import * as SentryElectron from '@sentry/electron/main';
import setupSentry from '../../submodules/extension/app/scripts/lib/setupSentry';
import { getDesktopVersion } from '../utils/version';
import { ElectronBridge } from './renderer/preload';

declare global {
  interface Window {
    electronBridge: ElectronBridge;
  }
}

declare const global: typeof globalThis & {
  isDesktopApp: boolean;
  stateHooks: Record<string, any>;
  sentry: unknown;
};

if (!global.self) {
  global.self = {} as unknown as Window & typeof globalThis;
  // required by symmetric encryption and crypto utils
  global.crypto = webcrypto as any;
  global.isDesktopApp = true;

  // represents the state and the identity of the user agent
  global.navigator = {
    // determines the current browser, used for sentry setup and metrics on the background
    userAgent: 'Firefox',
  } as Navigator;

  // represents a window containing a DOM document
  global.window = {
    // supports fetchWithCache
    Headers,
    navigator: global.navigator,
    // required by axios, utils and deep link
    location: {
      href: 'test.com',
    },
    // required by the background to send CONNECTION_READY (mv3) and contentscript
    postMessage: () => undefined,
    // add listeners required by deep link, phishing warning page on the background
    addEventListener: () => undefined,
  } as unknown as Window & typeof globalThis;

  // required by `dom-helpers` and various other libraries
  global.document = {
    // creates iframe for phishing warning page on the background and trezor connect
    createElement: () => ({
      pathname: '/',
      setAttribute: () => undefined,
    }),
    // required by trezor connect (EI css fix)
    head: {
      appendChild: () => undefined,
    },
    // loads iframe on the background to load Phishing Warning Page
    body: {
      appendChild: () => undefined,
    },
  } as unknown as Document;

  // the root compartment will populate this with hooks
  global.stateHooks = {};

  // setup sentry error reporting
  global.sentry = setupSentry({
    release: getDesktopVersion(),
    getState: () => global.stateHooks?.getSentryState?.() || {},
    Sentry: SentryElectron,
  } as any);
}

export {};

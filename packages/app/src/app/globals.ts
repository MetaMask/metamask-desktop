import 'global-agent/bootstrap';
import './logger-init';
import '../browser/browser-init';
import { webcrypto } from 'node:crypto';
import { Headers } from 'node-fetch';
import * as Sentry from '@sentry/electron/main';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { FilterEvents } from '../../submodules/extension/app/scripts/lib/sentry-filter-events';
import {
  removeUrlsFromBreadCrumb,
  rewriteReport,
} from '../../submodules/extension/app/scripts/lib/setupSentry';
import { getDesktopVersion } from '../utils/version';
import { ElectronBridge } from './renderer/preload';
import { getSentryDefaultOptions } from './renderer/setup-sentry';

declare global {
  interface Window {
    electronBridge: ElectronBridge;
  }
}

declare const global: typeof globalThis & {
  isDesktopApp: boolean;
  desktopMetaMetricsOptIn: boolean;
  stateHooks: Record<string, any>;
  sentry: unknown;
};

if (!global.self) {
  global.self = {} as unknown as Window & typeof globalThis;
  // required by symmetric encryption and crypto utils
  global.crypto = webcrypto as any;

  global.isDesktopApp = true;
  global.desktopMetaMetricsOptIn = false;

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

  const getState = () => global.stateHooks?.getSentryState?.() || {};
  const release = getDesktopVersion();

  // Init Sentry in the main process before lavamoat
  const sentryOptions = getSentryDefaultOptions(release);
  Sentry.init({
    ...sentryOptions,
    ipcMode: Sentry.IPCMode.Both,
    integrations: [
      new FilterEvents({
        getMetaMetricsEnabled: () => {
          const extensionState = getState();

          const hasValidExtensionState =
            extensionState.store?.metamask?.desktopEnabled;

          const extensionMetaMetricsOptIn =
            extensionState.store?.metamask?.participateInMetaMetrics;

          const { desktopMetaMetricsOptIn } = global;

          // Desktop opt in must be enabled
          // Extension opt in must be enabled if desktop currently enabled
          const shouldShareMetrics =
            desktopMetaMetricsOptIn &&
            (!hasValidExtensionState || extensionMetaMetricsOptIn);

          return shouldShareMetrics;
        },
      }),
      new Dedupe() as Integration,
      new ExtraErrorData() as Integration,
    ],
    beforeSend: (report) => rewriteReport(report, getState),
    beforeBreadcrumb(breadcrumb) {
      if (getState) {
        const appState = getState();
        if (
          Object.values(appState).length &&
          (!appState?.store?.metamask?.participateInMetaMetrics ||
            !appState?.store?.metamask?.completedOnboarding ||
            breadcrumb?.category === 'ui.input')
        ) {
          return null;
        }
      } else {
        return null;
      }
      const newBreadcrumb = removeUrlsFromBreadCrumb(breadcrumb);
      return newBreadcrumb;
    },
  });

  global.sentry = Sentry;
}

export {};

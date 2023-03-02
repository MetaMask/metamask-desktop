import * as Sentry from '@sentry/electron/renderer';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';
import { Integration } from '@sentry/types/dist/integration';
import { getSentryDefaultOptions } from './setup-sentry';

declare const global: typeof globalThis & {
  stateHooks: Record<string, any>;
  sentry: unknown;
};
const sentryDefaultOptions = getSentryDefaultOptions(
  `${process.env.PACKAGE_VERSION}-desktop.0`,
);

const getState = () => global.stateHooks?.getSentryState?.() || {};

Sentry.init({
  ...sentryDefaultOptions,
  integrations: [
    new Dedupe() as Integration,
    new ExtraErrorData() as Integration,
  ],
  beforeSend: async (event) => {
    const extensionState = getState();

    const hasValidExtensionState =
      extensionState.store?.metamask?.desktopEnabled;

    const extensionMetaMetricsOptIn =
      extensionState.store?.metamask?.participateInMetaMetrics;

    const desktopMetaMetricsOptIn =
      await window.electronBridge.getDesktopMetricsDecision();

    // Desktop opt in must be enabled
    // Extension opt in must be enabled if desktop currently enabled
    const shouldShareMetrics =
      (desktopMetaMetricsOptIn && !hasValidExtensionState) ||
      extensionMetaMetricsOptIn;
    if (shouldShareMetrics) {
      return event;
    }

    return null;
  },
});

global.sentry = Sentry;

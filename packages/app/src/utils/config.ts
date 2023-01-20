import {
  envBool,
  envInt,
  envStringMatch,
} from '@metamask/desktop/dist/utils/config';

const loadConfig = () => {
  // Cannot use dynamic references to envs as build system does find and replace
  const port = envInt(process.env.WEB_SOCKET_PORT, 7071);
  const isAppTest = envBool(process.env.UI_TEST);

  const compatibilityVersionDesktopTest = envInt(
    process.env.COMPATIBILITY_VERSION_DESKTOP_TEST,
  );

  const compatibilityVersionDesktop = envInt(
    process.env.COMPATIBILITY_VERSION_DESKTOP,
    1,
  );

  const compatibilityVersionDesktopFinal =
    isAppTest && compatibilityVersionDesktopTest !== undefined
      ? compatibilityVersionDesktopTest
      : compatibilityVersionDesktop;

  return {
    enableUpdates: envBool(process.env.DESKTOP_ENABLE_UPDATES),
    isExtensionTest: envBool(process.env.IN_TEST),
    isAppTest,
    isUnitTest: envStringMatch(process.env.NODE_ENV, 'test'),
    skipOtpPairingFlow: envBool(process.env.SKIP_OTP_PAIRING_FLOW),
    uiDebug: envBool(process.env.DESKTOP_UI_DEBUG),
    compatibilityVersion: {
      desktop: compatibilityVersionDesktopFinal,
    },
    ui: {
      enableDevTools: envBool(process.env.DESKTOP_UI_ENABLE_DEV_TOOLS),
      forceClose: envBool(process.env.DESKTOP_UI_FORCE_CLOSE),
      preventOpenOnStartup: envBool(
        process.env.DESKTOP_PREVENT_OPEN_ON_STARTUP,
      ),
    },
    webSocket: {
      disableEncryption: envBool(process.env.DISABLE_WEB_SOCKET_ENCRYPTION),
      port,
      url: `ws://localhost:${port}`,
    },
  };
};

export type ConfigType = ReturnType<typeof loadConfig>;

let configObject: ConfigType;

// eslint-disable-next-line jsdoc/require-jsdoc
export default function cfg(): ConfigType {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
}

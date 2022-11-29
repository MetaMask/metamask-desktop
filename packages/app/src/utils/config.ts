import {
  envBool,
  envInt,
  envStringMatch,
} from '@metamask/desktop/dist/utils/config';

const loadConfig = () => {
  // Cannot use dynamic references to envs as build system does find and replace
  const port = envInt(process.env.WEB_SOCKET_PORT, 7071);

  return {
    enableUpdates: envBool(process.env.DESKTOP_ENABLE_UPDATES),
    isExtensionTest: envBool(process.env.IN_TEST),
    isAppTest: envBool(process.env.UI_TEST),
    isTest: envStringMatch(process.env.NODE_ENV, 'test'),
    mv3: envBool(process.env.ENABLE_MV3),
    skipOtpPairingFlow: envBool(process.env.SKIP_OTP_PAIRING_FLOW),
    compatibilityVersion: {
      desktop: envInt(process.env.COMPATIBILITY_VERSION_DESKTOP, 1),
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

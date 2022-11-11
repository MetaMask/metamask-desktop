const envStringMatch = (
  value: string | undefined,
  expected: string,
): boolean => {
  if (!value) {
    return false;
  }

  return value.toLowerCase
    ? value.toLowerCase() === expected.toLowerCase()
    : false;
};

const envInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
};

const envBool = (
  value: string | boolean | undefined,
  defaultValue = false,
): boolean => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (value === true || value === false) {
    return value;
  }

  return envStringMatch(value, 'true');
};

const loadConfig = () => {
  // Cannot use dynamic references to envs as build system does find and replace
  const port = envInt(process.env.WEB_SOCKET_PORT, 7071);

  return {
    desktop: {
      enableUpdates: envBool(process.env.DESKTOP_ENABLE_UPDATES),
      isTest: envBool(process.env.IN_TEST),
      mv3: envBool(process.env.ENABLE_MV3),
      skipOtpPairingFlow: envBool(process.env.SKIP_OTP_PAIRING_FLOW),
      compatibilityVersion: {
        desktop: envInt(process.env.COMPATIBILITY_VERSION_DESKTOP, 1),
        extension: envInt(process.env.COMPATIBILITY_VERSION_EXTENSION, 1),
      },
      webSocket: {
        disableEncryption: envBool(process.env.DISABLE_WEB_SOCKET_ENCRYPTION),
        port,
        url: `ws://localhost:${port}`,
      },
    },
  };
};

export type ConfigType = ReturnType<typeof loadConfig>;

let configObject: ConfigType;

export default function cfg(): ConfigType {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
}

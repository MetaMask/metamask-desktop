export const envStringMatch = (
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

export function envInt(value: string | undefined): number | undefined;
export function envInt(value: string | undefined, defaultValue: number): number;
export function envInt(
  value: string | undefined,
  defaultValue?: number,
): number | undefined {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
}

export const envBool = (
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
    isDebug: envBool(process.env.METAMASK_DEBUG),
    isExtensionTest: envBool(process.env.IN_TEST),
    skipOtpPairingFlow: envBool(process.env.SKIP_OTP_PAIRING_FLOW),
    compatibilityVersion: {
      extension: envInt(process.env.COMPATIBILITY_VERSION_EXTENSION, 1),
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

export const cfg = (): ConfigType => {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
};

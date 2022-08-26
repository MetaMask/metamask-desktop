let configObject;

const envStringMatch = (value, expected) => {
  if (!value) {
    return false;
  }
  return value.toLowerCase() === expected.toLowerCase();
};

const envInt = (value, defaultValue) => {
  if (!value) {
    return defaultValue;
  }
  return parseInt(value, 10);
};

const loadConfig = () => {
  // Cannot use dynamic references to envs as build system does find and replace
  const port = envInt(process.env.WEB_SOCKET_PORT, 7071);

  return {
    desktop: {
      isApp: envStringMatch(process.env.DESKTOP, 'APP'),
      isExtension: envStringMatch(process.env.DESKTOP, 'EXTENSION'),
      webSocket: {
        port,
        url: `ws://localhost:${port}`,
      },
      enableUpdates: envStringMatch(process.env.DESKTOP_ENABLE_UPDATES, 'true'),
    },
  };
};

export default function cfg() {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
}

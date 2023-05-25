// eslint-disable-next-line no-empty-function
const noop = () => {};

global.platform = {
  currentTab: noop,
  closeCurrentWindow: noop,
};

global.browser = {
  ...(global?.browser || {}),
  runtime: {
    ...(global?.browser?.runtime || {}),
    getManifest: () => ({ manifest_version: 2 }),
  },
};

export {};

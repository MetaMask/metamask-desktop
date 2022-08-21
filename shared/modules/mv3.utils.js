import browser from '../../app/scripts/desktop/node-browser';

export const isManifestV3 = () =>
  browser.runtime.getManifest().manifest_version === 3;

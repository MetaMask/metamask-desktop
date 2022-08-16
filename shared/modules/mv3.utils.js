import browser from '../../app/scripts/node_browser';

export const isManifestV3 = () =>
  browser.runtime.getManifest().manifest_version === 3;

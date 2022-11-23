import { browser } from '@metamask/desktop/dist/browser';

const configOverride = false;

export const isManifestV3 =
  browser?.runtime.getManifest().manifest_version === 3 || configOverride;

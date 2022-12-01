import { browser } from '@metamask/desktop/dist/browser';

export const isManifestV3 =
  browser?.runtime.getManifest().manifest_version === 3;

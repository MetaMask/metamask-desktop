import { browser, cfg } from '@metamask/desktop';

export const isManifestV3 =
  browser?.runtime.getManifest().manifest_version === 3 ||
  cfg().desktop.mv3 === true;

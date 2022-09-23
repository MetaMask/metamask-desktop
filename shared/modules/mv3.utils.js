import cfg from '../../app/scripts/desktop/config';
import { browser } from '../../app/scripts/desktop/extension-polyfill';

export const isManifestV3 =
  browser.runtime.getManifest().manifest_version === 3 ||
  cfg().desktop.mv3 === true;

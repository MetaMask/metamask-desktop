import cfg from '../../app/scripts/desktop/utils/config';
import { browser } from '../../app/scripts/desktop/browser/browser-polyfill';

export const isManifestV3 =
  browser.runtime.getManifest().manifest_version === 3 ||
  cfg().desktop.mv3 === true;

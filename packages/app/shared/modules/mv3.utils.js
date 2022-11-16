import { browser } from '@metamask/desktop';
import cfg from '../../app/scripts/desktop/utils/config';

export const isManifestV3 =
  browser?.runtime.getManifest().manifest_version === 3 ||
  cfg().desktop.mv3 === true;

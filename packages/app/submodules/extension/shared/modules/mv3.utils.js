import { browser } from '@metamask/desktop/dist/browser';

let configOverride = false;

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
// eslint-disable-next-line import/first
import cfg from '../../../../src/utils/config';

configOverride = cfg().mv3;
///: END:ONLY_INCLUDE_IN

export const isManifestV3 =
  browser?.runtime.getManifest().manifest_version === 3 || configOverride;

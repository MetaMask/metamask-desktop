import ExtensionPlatform from '../../platforms/extension';
import cfg from './config';

const DESKTOP_VERSION = '10.19.0';

const getExtensionVersion = (): string => {
  return new ExtensionPlatform().getVersion();
};

const getDesktopVersion = (): string => {
  return `${DESKTOP_VERSION}-desktop.0`;
};

export const getVersion = (): string => {
  if (cfg().desktop.isApp) {
    return getDesktopVersion();
  }

  return getExtensionVersion();
};

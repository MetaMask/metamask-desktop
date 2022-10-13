import ExtensionPlatform from '../../platforms/extension';
import cfg from './config';

const getPackageVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return process.env.PACKAGE_VERSION!.replace('"', '');
};

const getExtensionVersion = (): string => {
  return new ExtensionPlatform().getVersion();
};

const getDesktopVersion = (): string => {
  return `${getPackageVersion()}-desktop.0`;
};

export const getVersion = (): string => {
  if (cfg().desktop.isApp) {
    return getDesktopVersion();
  }

  return getExtensionVersion();
};

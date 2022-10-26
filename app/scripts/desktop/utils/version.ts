import ExtensionPlatform from '../../platforms/extension';

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
  let version: string;

  ///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
  version = getDesktopVersion();
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:EXCLUDE_IN(desktopapp)
  version = getExtensionVersion();
  ///: END:EXCLUDE_IN

  return version;
};

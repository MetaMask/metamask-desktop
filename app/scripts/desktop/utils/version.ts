///: BEGIN:EXCLUDE_IN(desktopapp)
import ExtensionPlatform from '../../platforms/extension';

const getExtensionVersion = (): string => {
  return new ExtensionPlatform().getVersion();
};
///: END:EXCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
const getPackageVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return process.env.PACKAGE_VERSION!.replace(/["]+/gu, '');
};

const getDesktopVersion = (): string => {
  return `${getPackageVersion()}-desktop.0`;
};
///: END:ONLY_INCLUDE_IN

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

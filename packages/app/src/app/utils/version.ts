const getPackageVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return process.env.PACKAGE_VERSION!.replace(/["]+/gu, '');
};

export const getDesktopVersion = (): string => {
  return `${getPackageVersion()}-desktop.0`;
};

export const getNumericalDesktopVersion = (): string => {
  return `${getPackageVersion()}.0`;
};

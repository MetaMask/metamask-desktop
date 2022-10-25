export type ClientId = string;

export interface DesktopState {
  desktopEnabled?: boolean;
}

export interface VersionCheckResult {
  extensionVersion: string;
  desktopVersion: string;
  isExtensionVersionValid: boolean;
  isDesktopVersionValid: boolean;
}

export interface TestConnectionResult {
  isConnected: boolean;
  versionCheck?: VersionCheckResult;
}

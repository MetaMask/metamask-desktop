export type ClientId = string;

export interface DesktopState {
  desktopEnabled?: boolean;
  pairingKey?: string;
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

export interface DisconnectEventOpts {
  isDisconnectedByUser: boolean;
}

export interface VersionData {
  version: string;
  compatibilityVersion: number;
}

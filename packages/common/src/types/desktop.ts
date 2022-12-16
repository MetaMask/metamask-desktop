export type ClientId = string;

export interface DesktopState {
  desktopEnabled?: boolean;
  pairingKey?: string;
  pairingKeyHash?: string;
}

export interface RawState {
  data: {
    DesktopController: DesktopState;
    [otherOptions: string]: unknown;
  };
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
  pairingKeyCheck?: PairingKeyStatus;
}

export interface VersionData {
  version: string;
  compatibilityVersion: number;
}

export interface ConnectionOptions {
  isTestConnection: boolean;
}

export enum PairingKeyStatus {
  MATCH = 'MATCH',
  NO_MATCH = 'NO_MATCH',
  MISSING = 'MISSING',
}

export type ClientId = string;

export interface TestConnectionResult {
  success: boolean;
}

export interface DesktopState {
  desktopEnabled?: boolean;
  isPairing?: boolean;
}

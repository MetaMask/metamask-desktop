import { ConnectionType, RemotePortData } from './background';
import { ClientId, VersionData } from './desktop';

export interface NewConnectionMessage {
  clientId: ClientId;
  remotePort: RemotePortData;
  connectionType: ConnectionType;
}

export interface EndConnectionMessage {
  clientId: ClientId;
}

export enum BrowserControllerAction {
  BROWSER_ACTION_SHOW_POPUP = 'BROWSER_ACTION_SHOW_POPUP',
}

export type BrowserControllerMessage = BrowserControllerAction;

export interface StatusMessage {
  isWebSocketConnected: boolean;
  connections: NewConnectionMessage[];
  isDesktopEnabled?: boolean;
}

export type PairingRequestMessage = {
  otp: string;
};

export type PairingResultMessage = {
  isDesktopEnabled: boolean;
};

export type PairingKeyRequestMessage = {
  isRequestPairingKey: boolean;
};

export type PairingKeyResponseMessage = {
  pairingKey: string | undefined;
};

export type CheckVersionRequestMessage = {
  extensionVersionData: VersionData;
};

export type CheckVersionResponseMessage = {
  desktopVersionData: VersionData;
  isExtensionSupported: boolean;
};

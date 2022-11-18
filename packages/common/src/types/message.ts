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
export interface PairingRequestMessage {
  otp: string;
}

export interface PairingResultMessage {
  isDesktopEnabled: boolean;
  pairingKey?: string;
}

export interface PairingKeyRequestMessage {
  isRequestPairingKey: boolean;
}

export interface PairingKeyResponseMessage {
  pairingKey: string | undefined;
}

export interface CheckVersionRequestMessage {
  extensionVersionData: VersionData;
}

export interface CheckVersionResponseMessage {
  desktopVersionData: VersionData;
  isExtensionSupported: boolean;
}

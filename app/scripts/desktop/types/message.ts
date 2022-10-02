import { ConnectionType, RemotePortData } from './background';
import { ClientId } from './desktop';

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
  isDesktopSynced?: boolean;
}

export type PairingMessage = {
  otp: string;
  isPaired: boolean;
};

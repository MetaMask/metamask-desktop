import { ConnectionType, RemotePortData } from './background';
import { ClientId } from './desktop';

export interface HandshakeMessage {
  clientId: ClientId;
  remotePort: RemotePortData;
  connectionType: ConnectionType;
}

export interface ConnectionControllerMessage {
  clientId: ClientId;
}

export enum BrowserControllerAction {
  BROWSER_ACTION_SHOW_POPUP = 'BROWSER_ACTION_SHOW_POPUP',
}

export type BrowserControllerMessage = BrowserControllerAction;

export interface StatusMessage {
  isWebSocketConnected: boolean;
  connections: HandshakeMessage[];
}

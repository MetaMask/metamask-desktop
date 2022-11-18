import { NewConnectionMessage } from '@metamask/desktop';

export interface StatusMessage {
  isWebSocketConnected: boolean;
  connections: NewConnectionMessage[];
  isDesktopEnabled?: boolean;
}

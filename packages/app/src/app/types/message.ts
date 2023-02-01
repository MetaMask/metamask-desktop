import { NewConnectionMessage } from '@metamask/desktop/dist/types';

export interface StatusMessage {
  isWebSocketConnected: boolean;
  connections: NewConnectionMessage[];
  isDesktopPaired?: boolean;
}

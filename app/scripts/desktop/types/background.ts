import { Duplex } from 'stream';

export interface RemotePortData {
  name: string;
  sender: {
    url: string;
  };
}

export interface RemotePort extends RemotePortData {
  stream: Duplex;
  onMessage: {
    addListener: () => undefined;
  };
}

export type ConnectRemoteFactory = (remotePort: RemotePort) => undefined;

export type State = any;

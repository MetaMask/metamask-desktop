import { Duplex } from 'stream';

export interface RemotePortData {
  name: string;
  sender: {
    url: string;
    id: string;
  };
}

export interface RemotePort extends RemotePortData {
  stream: Duplex;
  onMessage: {
    addListener: () => undefined;
  };
}

export type ConnectRemoteFactory = (remotePort: RemotePort) => undefined;

export enum ConnectionType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

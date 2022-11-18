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

export enum ConnectionType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

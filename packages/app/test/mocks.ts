import { Duplex, EventEmitter } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { WebSocketServer } from 'ws';
import ElectronStore from 'electron-store';
import {
  NodeWebSocket,
  WebSocketStream,
} from '@metamask/desktop/dist/web-socket-stream';
import { ConnectionType } from '@metamask/desktop/dist/types';
import ExtensionConnection from '../src/app/extension-connection';
import { DesktopPairing } from '../src/shared/pairing';

export const DECRYPTED_STRING_MOCK = 'testDecryptedData';
export const PROPERTY_MOCK = 'test';
export const PROPERTY_2_MOCK = 'test2';
export const VALUE_MOCK = 'value';
export const VALUE_2_MOCK = 'value2';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const DATA_2_MOCK = { [PROPERTY_2_MOCK]: VALUE_2_MOCK };
export const REMOTE_PORT_NAME_MOCK = 'testPort';
export const REMOTE_PORT_SENDER_MOCK = { test2: 'value2' };
export const CLIENT_ID_MOCK = 3;
export const CLIENT_ID_2_MOCK = 12;
export const PORT_MOCK = 123;
export const PASSWORD_MOCK = 'testPassword';
export const ENCRYPTED_CYPHER_MOCK = Buffer.from('encryptedCypherTest');
export const ENCRYPTED_CYPHER_FILE_MOCK = 'encryptedCypherFileTest';
export const ARGS_MOCK = ['test123', 123, true];
export const UUID_MOCK = '6328e6ae-f867-4876-af6f-22a44efbe251';
export const OTP_MOCK = '123456';
export const VERSION_MOCK = '123.456.789.012';
export const VERSION_2_MOCK = '456.123.789.012';
export const RELEASE_MOCK = 'mock-release';
export const SENTRY_DSN_MOCK = 'https://mock-dsn';
export const METAMASK_ENVIRONMENT_DEV_MOCK = 'development';
export const METAMASK_ENVIRONMENT_PROD_MOCK = 'production';

export const NEW_CONNECTION_MESSAGE_MOCK = {
  clientId: CLIENT_ID_MOCK,
  connectionType: ConnectionType.INTERNAL,
  remotePort: { name: REMOTE_PORT_NAME_MOCK, sender: REMOTE_PORT_SENDER_MOCK },
};

export const createWebSocketServerMock = (): jest.Mocked<WebSocketServer> =>
  ({
    on: jest.fn(),
  } as unknown as jest.Mocked<WebSocketServer>);

export const createWebSocketNodeMock = (): jest.Mocked<NodeWebSocket> =>
  ({
    readyState: 1,
    on: jest.fn(),
    send: jest.fn(),
    removeAllListeners: jest.fn(),
    close: jest.fn(),
    removeListener: jest.fn(),
  } as unknown as jest.Mocked<NodeWebSocket>);

export const createStreamMock = (): jest.Mocked<Duplex> =>
  ({
    write: jest.fn(),
    on: jest.fn(),
    pipe: jest.fn(),
    end: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    destroy: jest.fn(),
    removeAllListeners: jest.fn(),
    removeListener: jest.fn(),
  } as unknown as jest.Mocked<Duplex>);

export const createWebSocketStreamMock = (): jest.Mocked<WebSocketStream> =>
  ({
    ...createStreamMock(),
    init: jest.fn(),
    removeListener: jest.fn(),
  } as unknown as jest.Mocked<WebSocketStream>);

export const createMultiplexMock = (): jest.Mocked<ObjectMultiplex & Duplex> =>
  ({
    ...createStreamMock(),
    createStream: jest.fn(),
  } as any);

export const createEventEmitterMock = (): jest.Mocked<EventEmitter> =>
  ({
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    removeListener: jest.fn(),
  } as any);

export const createExtensionConnectionMock =
  (): jest.Mocked<ExtensionConnection> =>
    ({
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
      removeListener: jest.fn(),
      getPairing: jest.fn(),
      disable: jest.fn(),
    } as any);

export const createElectronStoreMock = (): jest.Mocked<ElectronStore> =>
  ({
    clear: jest.fn(),
  } as any);

export const createDesktopPairingMock = (): jest.Mocked<DesktopPairing> =>
  ({ init: jest.fn() } as any);

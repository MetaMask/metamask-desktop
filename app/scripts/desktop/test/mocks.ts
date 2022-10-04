import { Duplex, EventEmitter } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { WebSocketServer } from 'ws';
import NotificationManager from '../../lib/notification-manager';
import { ConnectionType, RemotePort } from '../types/background';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../web-socket-stream';

export const PUBLIC_KEY_MOCK = 'testPublicKey';
export const PRIVATE_KEY_MOCK = 'testPrivateKey';
export const DECRYPTED_STRING_MOCK = 'testDecryptedData';
export const DECRYPTED_BUFFER_MOCK = Buffer.from(DECRYPTED_STRING_MOCK);
export const ENCRYPTED_STRING_MOCK = 'testEncryptedData';
export const PROPERTY_MOCK = 'test';
export const PROPERTY_2_MOCK = 'test2';
export const VALUE_MOCK = 'value';
export const VALUE_2_MOCK = 'value2';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const DATA_2_MOCK = { test2: VALUE_2_MOCK };
export const JSON_MOCK = '{"test":"value"}';
export const STRING_DATA_MOCK = 'testStringData';
export const STRING_DATA_BUFFER_MOCK = Buffer.from(STRING_DATA_MOCK);
export const REMOTE_PORT_NAME_MOCK = 'testPort';
export const REMOTE_PORT_SENDER_MOCK = { test2: 'value2' };
export const CLIENT_ID_MOCK = 3;
export const CLIENT_ID_2_MOCK = 12;
export const PORT_MOCK = 123;
export const PASSWORD_MOCK = 'testPassword';
export const STORE_MOCK = { store: DATA_MOCK };
export const STREAM_MOCK = 'testStream';
export const TYPE_MOCK = 'testType';
export const METHOD_MOCK = 'testMethod';
export const RESULT_MOCK = 'testResult';
export const KEY_MOCK = {} as CryptoKey;
export const EXPORTED_KEY_MOCK = Buffer.from([1, 2, 3]);
export const ENCRYPTED_BUFFER_MOCK = Buffer.from([4, 5, 6]);
export const IV_BUFFER_MOCK = Buffer.from([7, 8, 9]);
export const JSON_RPC_ID_MOCK = 123456;
export const ARGS_MOCK = ['test123', 123, true];

export const EXPORTED_KEY_HEX_MOCK =
  Buffer.from(EXPORTED_KEY_MOCK).toString('hex');

export const ENCRYPTED_HEX_MOCK = Buffer.from(ENCRYPTED_BUFFER_MOCK).toString(
  'hex',
);

export const IV_HEX_MOCK = Buffer.from(IV_BUFFER_MOCK).toString('hex');

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
  } as unknown as jest.Mocked<NodeWebSocket>);

export const createWebSocketBrowserMock = (): jest.Mocked<BrowserWebSocket> =>
  ({
    readyState: 1,
    addEventListener: jest.fn(),
    send: jest.fn(),
  } as unknown as jest.Mocked<BrowserWebSocket>);

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
  } as unknown as jest.Mocked<Duplex>);

export const createWebSocketStreamMock = (): jest.Mocked<WebSocketStream> =>
  ({
    ...createStreamMock(),
    init: jest.fn(),
    removeListener: jest.fn(),
  } as unknown as jest.Mocked<WebSocketStream>);

export const createRemotePortMock = (): jest.Mocked<RemotePort> =>
  ({
    name: REMOTE_PORT_NAME_MOCK,
    sender: REMOTE_PORT_SENDER_MOCK,
    onMessage: {
      addListener: jest.fn(),
    },
    onDisconnect: {
      addListener: jest.fn(),
    },
  } as unknown as jest.Mocked<RemotePort>);

export const createNotificationManagerMock =
  (): jest.Mocked<NotificationManager> =>
    ({
      showPopup: jest.fn(),
    } as unknown as jest.Mocked<NotificationManager>);

export const createMultiplexMock = (): jest.Mocked<ObjectMultiplex & Duplex> =>
  ({
    ...createStreamMock(),
    createStream: jest.fn(),
  } as unknown as jest.Mocked<ObjectMultiplex>);

export const createEventEmitterMock = (): jest.Mocked<EventEmitter> =>
  ({
    on: jest.fn(),
  } as any);

import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { WebSocketServer } from 'ws';
import NotificationManager from '../../lib/notification-manager';
import { RemotePort } from '../types/background';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../web-socket-stream';

export const PUBLIC_KEY_MOCK = 'testPublicKey';
export const PRIVATE_KEY_MOCK = 'testPrivateKey';
export const DECRYPTED_STRING_MOCK = 'testDecryptedData';
export const ENCRYPTED_STRING_MOCK = 'testEncryptedData';
export const DATA_MOCK = { test: 'value' };
export const DATA_2_MOCK = { test2: 'value2' };
export const JSON_MOCK = '{"test":"value"}';
export const STRING_DATA_MOCK = 'testStringData';
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

export const HANDSHAKE_MOCK = {
  clientId: CLIENT_ID_MOCK,
  remotePort: { name: REMOTE_PORT_NAME_MOCK, sender: REMOTE_PORT_SENDER_MOCK },
};

export const createWebSocketServerMock = (): jest.Mocked<WebSocketServer> =>
  ({
    on: jest.fn(),
  } as unknown as jest.Mocked<WebSocketServer>);

export const createWebSocketNodeMock = (): jest.Mocked<NodeWebSocket> =>
  ({
    on: jest.fn(),
    send: jest.fn(),
  } as unknown as jest.Mocked<NodeWebSocket>);

export const createWebSocketBrowserMock = (): jest.Mocked<BrowserWebSocket> =>
  ({
    addEventListener: jest.fn(),
    send: jest.fn(),
    readyState: 1,
  } as unknown as jest.Mocked<BrowserWebSocket>);

export const createStreamMock = (): jest.Mocked<Duplex> =>
  ({
    write: jest.fn(),
    on: jest.fn(),
    pipe: jest.fn(),
    end: jest.fn(),
  } as unknown as jest.Mocked<Duplex>);

export const createWebSocketStreamMock = (): jest.Mocked<WebSocketStream> =>
  ({
    ...createStreamMock(),
    init: jest.fn(),
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

import { Duplex, EventEmitter } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { WebSocketServer } from 'ws';
import { ObservableStore } from '@metamask/obs-store';
import ElectronStore from 'electron-store';
import NotificationManager from '../../lib/notification-manager';
import { ConnectionType, RemotePort } from '../types/background';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../shared/web-socket-stream';
import ExtensionConnection from '../app/extension-connection';
import DesktopConnection from '../extension/desktop-connection';
import { DesktopPairing, ExtensionPairing } from '../shared/pairing';
import { TestConnectionResult } from '../types/desktop';
import { ExtensionVersionCheck } from '../shared/version-check';
import ExtensionPlatform from 'app/scripts/platforms/extension';

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
export const DATA_2_MOCK = { [PROPERTY_2_MOCK]: VALUE_2_MOCK };
export const JSON_MOCK = '{"test":"value"}';
export const STRING_DATA_MOCK = 'testStringData';
export const STRING_DATA_BUFFER_MOCK = Buffer.from(STRING_DATA_MOCK);
export const REMOTE_PORT_NAME_MOCK = 'testPort';
export const REMOTE_PORT_SENDER_MOCK = { test2: 'value2' };
export const CLIENT_ID_MOCK = 3;
export const CLIENT_ID_2_MOCK = 12;
export const PORT_MOCK = 123;
export const PASSWORD_MOCK = 'testPassword';
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
export const UUID_MOCK = '6328e6ae-f867-4876-af6f-22a44efbe251';
export const OTP_MOCK = '123456';
export const VERSION_MOCK = '123.456.789.012';
export const VERSION_2_MOCK = '456.123.789.012';
export const HASH_BUFFER_MOCK = Buffer.from([10, 11, 12]);
export const HASH_BUFFER_2_MOCK = Buffer.from([10, 11, 13]);
export const IV_HEX_MOCK = Buffer.from(IV_BUFFER_MOCK).toString('hex');
export const HASH_BUFFER_HEX_MOCK = HASH_BUFFER_MOCK.toString('hex');
export const HASH_BUFFER_2_HEX_MOCK = HASH_BUFFER_2_MOCK.toString('hex');

export const EXPORTED_KEY_HEX_MOCK =
  Buffer.from(EXPORTED_KEY_MOCK).toString('hex');

export const ENCRYPTED_HEX_MOCK = Buffer.from(ENCRYPTED_BUFFER_MOCK).toString(
  'hex',
);

export const NEW_CONNECTION_MESSAGE_MOCK = {
  clientId: CLIENT_ID_MOCK,
  connectionType: ConnectionType.INTERNAL,
  remotePort: { name: REMOTE_PORT_NAME_MOCK, sender: REMOTE_PORT_SENDER_MOCK },
};

export const TEST_CONNECTION_RESULT_MOCK: TestConnectionResult = {
  isConnected: true,
  versionCheck: {
    extensionVersion: '123',
    desktopVersion: '456',
    isDesktopVersionValid: true,
    isExtensionVersionValid: false,
  },
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

export const createWebSocketBrowserMock = (): jest.Mocked<BrowserWebSocket> =>
  ({
    readyState: 1,
    addEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
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
    removeAllListeners: jest.fn(),
    removeListener: jest.fn(),
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

export const createDesktopConnectionMock = (): jest.Mocked<DesktopConnection> =>
  ({
    transferState: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
    getDesktopVersion: jest.fn(),
    createStream: jest.fn(),
    removeAllListeners: jest.fn(),
    checkPairingKey: jest.fn(),
  } as any);

export const createObservableStoreMock = (): jest.Mocked<ObservableStore> =>
  ({
    getState: jest.fn(),
    updateState: jest.fn(),
  } as any);

export const createExtensionPairingMock = (): jest.Mocked<ExtensionPairing> =>
  ({
    generateOTP: jest.fn(),
    isPairingKeyMatch: jest.fn(),
    init: jest.fn(),
  } as any);

export const createElectronStoreMock = (): jest.Mocked<ElectronStore> =>
  ({
    clear: jest.fn(),
  } as any);

export const createExtensionVersionCheckMock =
  (): jest.Mocked<ExtensionVersionCheck> => ({ check: jest.fn() } as any);

export const createExtensionPlatformMock = (): jest.Mocked<ExtensionPlatform> =>
  ({ getVersion: jest.fn() } as any);

export const createDesktopPairingMock = (): jest.Mocked<DesktopPairing> =>
  ({ init: jest.fn() } as any);

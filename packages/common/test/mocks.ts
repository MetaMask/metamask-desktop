import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { ObservableStore } from '@metamask/obs-store';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../src/web-socket-stream';
import { RemotePort, TestConnectionResult } from '../src/types';
import { VersionCheck } from '../src/version-check';
import { Pairing } from '../src/pairing';
import DesktopConnection from '../src/desktop-connection';

export const PROPERTY_MOCK = 'test';
export const PROPERTY_2_MOCK = 'test2';
export const VALUE_MOCK = 'value';
export const VALUE_2_MOCK = 'value2';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const DATA_2_MOCK = { [PROPERTY_2_MOCK]: VALUE_2_MOCK };
export const IV_BUFFER_MOCK = Uint8Array.from([7, 8, 9]);
export const JSON_MOCK = '{"test":"value"}';
export const PUBLIC_KEY_MOCK = 'testPublicKey';
export const PRIVATE_KEY_MOCK = 'testPrivateKey';
export const STRING_DATA_MOCK = 'testStringData';
export const ARGS_MOCK = ['test123', 123, true];
export const UUID_MOCK = '6328e6ae-f867-4876-af6f-22a44efbe251';
export const VERSION_MOCK = '123.456.789.012';
export const VERSION_2_MOCK = '456.123.789.012';
export const STRING_DATA_BUFFER_MOCK = Buffer.from(STRING_DATA_MOCK);
export const METHOD_MOCK = 'testMethod';
export const RESULT_MOCK = 'testResult';
export const STREAM_MOCK = 'testStream';
export const TYPE_MOCK = 'testType';
export const HASH_BUFFER_MOCK = Buffer.from([10, 11, 12]);
export const HASH_BUFFER_HEX_MOCK = HASH_BUFFER_MOCK.toString('hex');
export const HASH_BUFFER_2_MOCK = Buffer.from([10, 11, 13]);
export const HASH_BUFFER_2_HEX_MOCK = HASH_BUFFER_2_MOCK.toString('hex');
export const OTP_MOCK = '123456';
export const WRONG_OTP_MOCK = '654321';
export const REMOTE_PORT_NAME_MOCK = 'testPort';
export const REMOTE_PORT_SENDER_MOCK = { test2: 'value2' };
export const JSON_RPC_ID_MOCK = 123456;
export const KEY_BYTES_MOCK = [4, 5, 6];
export const KEY_MOCK = {} as CryptoKey;
export const KEY_EXPORTED_MOCK = Uint8Array.from(KEY_BYTES_MOCK);
export const KEY_EXPORTED_HEX_MOCK =
  Buffer.from(KEY_BYTES_MOCK).toString('hex');
export const IV_BYTES_MOCK = [7, 8, 9];
export const IV_MOCK = Uint8Array.from(IV_BYTES_MOCK);
export const ENCRYPTED_BYTES_MOCK = [1, 2, 3];
export const ENCRYPTED_MOCK = Uint8Array.from([1, 2, 3]);
export const ENCRYPTED_BUFFER_MOCK = Buffer.from(ENCRYPTED_BYTES_MOCK);
export const ENCRYPTED_HEX_MOCK = ENCRYPTED_BUFFER_MOCK.toString('hex');
export const DECRYPTED_STRING_MOCK = 'decryptedData';
export const DECRYPTED_MOCK = new TextEncoder().encode(DECRYPTED_STRING_MOCK);

export const TEST_CONNECTION_RESULT_MOCK: TestConnectionResult = {
  isConnected: true,
  versionCheck: {
    extensionVersion: '123',
    desktopVersion: '456',
    isDesktopVersionValid: true,
    isExtensionVersionValid: false,
  },
};

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

export const createMultiplexMock = (): jest.Mocked<ObjectMultiplex & Duplex> =>
  ({
    ...createStreamMock(),
    createStream: jest.fn(),
  } as any);

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

export const createExtensionVersionCheckMock = (): jest.Mocked<VersionCheck> =>
  ({ check: jest.fn() } as any);

export const createExtensionPairingMock = (): jest.Mocked<Pairing> =>
  ({
    generateOTP: jest.fn(),
    checkPairingKeyMatch: jest.fn(),
    init: jest.fn(),
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
    setPaired: jest.fn(),
    checkVersions: jest.fn(),
  } as any);

export const createObservableStoreMock = (): jest.Mocked<ObservableStore> =>
  ({
    getState: jest.fn(),
    updateState: jest.fn(),
  } as any);

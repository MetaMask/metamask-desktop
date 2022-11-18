import { Duplex } from 'stream';
import {
  BrowserWebSocket,
  NodeWebSocket,
  WebSocketStream,
} from '../src/web-socket-stream';

export const PROPERTY_MOCK = 'test';
export const PROPERTY_2_MOCK = 'test2';
export const VALUE_MOCK = 'value';
export const VALUE_2_MOCK = 'value2';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const DATA_2_MOCK = { [PROPERTY_2_MOCK]: VALUE_2_MOCK };
export const DECRYPTED_STRING_MOCK = 'testDecryptedData';
export const DECRYPTED_BUFFER_MOCK = Buffer.from(DECRYPTED_STRING_MOCK);
export const ENCRYPTED_BUFFER_MOCK = Buffer.from([4, 5, 6]);
export const ENCRYPTED_HEX_MOCK = Buffer.from(ENCRYPTED_BUFFER_MOCK).toString(
  'hex',
);
export const EXPORTED_KEY_MOCK = Buffer.from([1, 2, 3]);
export const EXPORTED_KEY_HEX_MOCK =
  Buffer.from(EXPORTED_KEY_MOCK).toString('hex');
export const IV_BUFFER_MOCK = Buffer.from([7, 8, 9]);
export const IV_HEX_MOCK = Buffer.from(IV_BUFFER_MOCK).toString('hex');
export const JSON_MOCK = '{"test":"value"}';
export const KEY_MOCK = {} as CryptoKey;
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
export const OTP_MOCK = '123456';

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

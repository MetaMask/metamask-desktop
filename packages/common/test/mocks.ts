import { Duplex } from 'stream';
import { BrowserWebSocket, NodeWebSocket } from '../src/web-socket-stream';

export const PROPERTY_MOCK = 'test';
export const PROPERTY_2_MOCK = 'test2';
export const VALUE_MOCK = 'value';
export const VALUE_2_MOCK = 'value2';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const DATA_2_MOCK = { [PROPERTY_2_MOCK]: VALUE_2_MOCK };
export const STRING_DATA_MOCK = 'testStringData';
export const ARGS_MOCK = ['test123', 123, true];
export const UUID_MOCK = '6328e6ae-f867-4876-af6f-22a44efbe251';

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

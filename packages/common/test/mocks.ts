import { BrowserWebSocket, NodeWebSocket } from '../src/web-socket-stream';

export const PROPERTY_MOCK = 'test';
export const VALUE_MOCK = 'value';
export const DATA_MOCK = { [PROPERTY_MOCK]: VALUE_MOCK };
export const STRING_DATA_MOCK = 'testStringData';

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

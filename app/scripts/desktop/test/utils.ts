import { Duplex } from 'stream';
import { BrowserWebSocket, NodeWebSocket } from '../web-socket-stream';

export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

export const simulateEvent = async <T>(
  emitterMock: jest.Mocked<T>,
  method: keyof T,
  event: string,
  data: any,
) => {
  const methodMock: jest.Mocked<any> = emitterMock[method];

  const { calls }: { calls: [[event: string, handler: (data: any) => void]] } =
    methodMock.mock;

  calls
    .filter((call) => call[0] === event)
    .forEach((call) => {
      call[1](data);
    });

  await flushPromises();
};

export const simulateNodeEvent = async <T extends { on: any }>(
  emitterMock: jest.Mocked<T>,
  event: string,
  data?: any,
) => {
  await simulateEvent(emitterMock, 'on', event, data);
};

export const simulateBrowserEvent = async <T extends { addEventListener: any }>(
  emitterMock: jest.Mocked<T>,
  event: string,
  data?: any,
) => {
  await simulateEvent(emitterMock, 'addEventListener', event, { data });
};

export const simulateStreamMessage = async (
  streamMock: jest.Mocked<Duplex>,
  data: any,
) => {
  await simulateNodeEvent(streamMock, 'data', data);
};

export const simulateWebSocketMessage = async (
  webSocketMock: jest.Mocked<BrowserWebSocket | NodeWebSocket>,
  data: any,
) => {
  if ((webSocketMock as any).on) {
    await simulateNodeEvent(
      webSocketMock as jest.Mocked<NodeWebSocket>,
      'message',
      data,
    );
  } else {
    await simulateBrowserEvent(
      webSocketMock as jest.Mocked<BrowserWebSocket>,
      'message',
      data,
    );
  }
};

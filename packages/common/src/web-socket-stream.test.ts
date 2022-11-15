import { flushPromises, simulateWebSocketMessage } from '../test/utils';
import {
  DATA_MOCK,
  STRING_DATA_MOCK,
  createWebSocketBrowserMock,
  createWebSocketNodeMock,
} from '../test/mocks';
import { WebSocketStream } from './web-socket-stream';

describe('Web Socket Stream', () => {
  describe('on data', () => {
    it.each([
      ['desktop', true],
      ['extension', false],
    ])('supports object in %s', async (_, isNode) => {
      const readCallback = jest.fn();

      // eslint-disable-next-line jest/no-if
      const webSocketMock = isNode
        ? createWebSocketNodeMock()
        : createWebSocketBrowserMock();

      const webSocketStream = new WebSocketStream(webSocketMock);

      webSocketStream.on('data', readCallback);

      await simulateWebSocketMessage(webSocketMock, JSON.stringify(DATA_MOCK));

      expect(readCallback).toHaveBeenCalledTimes(1);
      expect(readCallback).toHaveBeenCalledWith(DATA_MOCK);
    });

    it.each([
      ['desktop', true],
      ['extension', false],
    ])('supports string in %s', async (_, isNode) => {
      const readCallback = jest.fn();

      // eslint-disable-next-line jest/no-if
      const webSocketMock = isNode
        ? createWebSocketNodeMock()
        : createWebSocketBrowserMock();

      const webSocketStream = new WebSocketStream(webSocketMock);

      webSocketStream.on('data', readCallback);

      await simulateWebSocketMessage(webSocketMock, STRING_DATA_MOCK);

      expect(readCallback).toHaveBeenCalledTimes(1);
      expect(readCallback).toHaveBeenCalledWith(STRING_DATA_MOCK);
    });
  });

  describe('write', () => {
    it.each([
      ['desktop', true],
      ['extension', false],
    ])('supports object in %s', async (_, isNode) => {
      const webSocketMock = isNode
        ? createWebSocketNodeMock()
        : createWebSocketBrowserMock();

      const webSocketStream = new WebSocketStream(webSocketMock);

      webSocketStream.write(DATA_MOCK);

      await flushPromises();

      expect(webSocketMock.send).toHaveBeenCalledTimes(1);
      expect(webSocketMock.send).toHaveBeenCalledWith(
        JSON.stringify(DATA_MOCK),
      );
    });

    it.each([
      ['desktop', true],
      ['extension', false],
    ])('supports string in %s', async (_, isNode) => {
      const webSocketMock = isNode
        ? createWebSocketNodeMock()
        : createWebSocketBrowserMock();

      const webSocketStream = new WebSocketStream(webSocketMock);

      webSocketStream.write(STRING_DATA_MOCK);

      await flushPromises();

      expect(webSocketMock.send).toHaveBeenCalledTimes(1);
      expect(webSocketMock.send).toHaveBeenCalledWith(STRING_DATA_MOCK);
    });
  });

  describe('read', () => {
    it('returns null', () => {
      expect(new WebSocketStream(createWebSocketNodeMock()).read()).toBeNull();
    });
  });
});

import WebSocketStream from './web-socket-stream';

const OBJECT_MOCK = {
  test: 'value',
};

const STRING_MOCK = 'testString';

const createWebSocketNodeMock = () => ({
  on: jest.fn(),
  send: jest.fn(),
});

const createWebSocketBrowserMock = () => ({
  addEventListener: jest.fn(),
  send: jest.fn(),
  readyState: 1,
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const simulateWebSocketMessage = async (webSocketMock, data) => {
  const addListenerMethod = webSocketMock.on || webSocketMock.addEventListener;
  const eventHandler = addListenerMethod.mock.calls[0][1];
  const request = webSocketMock.on ? data : { data };

  eventHandler(request);

  await flushPromises();
};

describe('WebSocketStream', () => {
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

      await simulateWebSocketMessage(
        webSocketMock,
        JSON.stringify(OBJECT_MOCK),
      );

      expect(readCallback).toHaveBeenCalledTimes(1);
      expect(readCallback).toHaveBeenCalledWith(OBJECT_MOCK);
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

      await simulateWebSocketMessage(webSocketMock, STRING_MOCK);

      expect(readCallback).toHaveBeenCalledTimes(1);
      expect(readCallback).toHaveBeenCalledWith(STRING_MOCK);
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

      webSocketStream.write(OBJECT_MOCK);

      await flushPromises();

      expect(webSocketMock.send).toHaveBeenCalledTimes(1);
      expect(webSocketMock.send).toHaveBeenCalledWith(
        JSON.stringify(OBJECT_MOCK),
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

      webSocketStream.write(STRING_MOCK);

      await flushPromises();

      expect(webSocketMock.send).toHaveBeenCalledTimes(1);
      expect(webSocketMock.send).toHaveBeenCalledWith(STRING_MOCK);
    });
  });

  describe('read', () => {
    it('returns null', () => {
      expect(new WebSocketStream(createWebSocketNodeMock()).read()).toBeNull();
    });
  });
});

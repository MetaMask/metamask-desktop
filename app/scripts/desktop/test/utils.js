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

export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

export const simulateEvent = async (emitterMock, method, event, data) => {
  const eventHandlerCall = emitterMock[method].mock.calls.find(
    (call) => call[0] === event,
  );

  if (!eventHandlerCall) {
    throw new Error(`Cannot find event handler for event - ${event}`);
  }

  eventHandlerCall[1](data);

  await flushPromises();
};

export const createWebSocketServer = () => ({
  on: jest.fn(),
});

export const createWebSocketNodeMock = () => ({
  on: jest.fn(),
  send: jest.fn(),
});

export const createWebSocketBrowserMock = () => ({
  addEventListener: jest.fn(),
  send: jest.fn(),
  readyState: 1,
});

export const createStreamMock = () => ({
  write: jest.fn(),
  on: jest.fn(),
  pipe: jest.fn(),
  end: jest.fn(),
});

export const createWebSocketStreamMock = () => ({
  ...createStreamMock(),
  init: jest.fn(),
});

export const createRemotePortMock = () => ({
  name: REMOTE_PORT_NAME_MOCK,
  sender: REMOTE_PORT_SENDER_MOCK,
  onMessage: {
    addListener: jest.fn(),
  },
  onDisconnect: {
    addListener: jest.fn(),
  },
});

export const createNotificationManagerMock = () => ({
  showPopup: jest.fn(),
});

export const createMultiplexMock = () => ({
  ...createStreamMock(),
  createStream: jest.fn(),
});

export const simulateNodeEvent = async (emitterMock, event, data) => {
  await simulateEvent(emitterMock, 'on', event, data);
};

export const simulateBrowserEvent = async (emitterMock, event, data) => {
  await simulateEvent(emitterMock, 'addEventListener', event, { data });
};

export const simulateRemotePortMessage = async (remotePortMock, data) => {
  const eventHandler = remotePortMock.onMessage.addListener.mock.calls[0][0];
  eventHandler(data);
  await flushPromises();
};

export const simulateRemotePortDisconnect = async (remotePortMock) => {
  const eventHandler = remotePortMock.onDisconnect.addListener.mock.calls[0][0];
  eventHandler();
  await flushPromises();
};

export const simulateStreamMessage = async (streamMock, data) => {
  await simulateNodeEvent(streamMock, 'data', data);
};

export const simulateWebSocketMessage = async (webSocketMock, data) => {
  if (webSocketMock.on) {
    await simulateNodeEvent(webSocketMock, 'message', data);
  } else {
    await simulateBrowserEvent(webSocketMock, 'message', data);
  }
};

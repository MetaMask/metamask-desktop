import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  BROWSER_ACTION_SHOW_POPUP,
} from '../../../shared/constants/desktop';
import DesktopConnection from './desktop-connection';
import cfg from './config';

const MESSAGE_MOCK = { test: 'value' };
const REMOTE_PORT_NAME_MOCK = 'testPort';
const REMOTE_PORT_SENDER_MOCK = { test2: 'value2' };

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const createRemotePortMock = () => ({
  onMessage: {
    addListener: jest.fn(),
  },
  onDisconnect: {
    addListener: jest.fn(),
  },
});

const simulateRemotePortMessage = async (remotePortMock, data) => {
  const eventHandler = remotePortMock.onMessage.addListener.mock.calls[0][0];
  eventHandler(data);
  await flushPromises();
};

const simulateRemotePortDisconnect = async (remotePortMock) => {
  const eventHandler = remotePortMock.onDisconnect.addListener.mock.calls[0][0];
  eventHandler();
  await flushPromises();
};

const simulateWebSocketMessage = async (webSocketMock, data) => {
  const eventHandler = webSocketMock.addEventListener.mock.calls.find(
    (call) => call[0] === 'message',
  )[1];
  eventHandler({ data });
  await flushPromises();
};

const webSocketMock = {
  send: jest.fn(),
  addEventListener: jest.fn(),
  readyState: 1,
};

const notificationManagerMock = {
  showPopup: jest.fn(),
};

describe('Desktop Connection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(global, 'WebSocket').mockImplementation();
    global.WebSocket.mockReturnValue(webSocketMock);
  });

  describe('createStream', () => {
    it('pipes remote port messages including client id to web socket', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      const desktopConnection = new DesktopConnection();
      const remotePortMock = createRemotePortMock();

      desktopConnection.createStream(remotePortMock);

      await simulateRemotePortMessage(remotePortMock, MESSAGE_MOCK);

      expect(webSocketMock.send).toHaveBeenLastCalledWith(
        JSON.stringify({ name: 1, data: MESSAGE_MOCK }),
      );
    });

    it('sends handshake to web socket', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      const desktopConnection = new DesktopConnection();
      const remotePortMock = {
        ...createRemotePortMock(),
        name: REMOTE_PORT_NAME_MOCK,
        sender: REMOTE_PORT_SENDER_MOCK,
      };

      desktopConnection.createStream(remotePortMock);
      await flushPromises();

      expect(webSocketMock.send).toHaveBeenCalledTimes(1);
      expect(webSocketMock.send).toHaveBeenCalledWith(
        JSON.stringify({
          name: 'handshakes',
          data: {
            clientId: 1,
            remotePort: {
              name: REMOTE_PORT_NAME_MOCK,
              sender: REMOTE_PORT_SENDER_MOCK,
            },
          },
        }),
      );
    });

    it('sends connection close message on port stream disconnect', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      const desktopConnection = new DesktopConnection();
      const remotePortMock = createRemotePortMock();

      desktopConnection.createStream(remotePortMock);
      await simulateRemotePortDisconnect(remotePortMock);

      expect(webSocketMock.send).toHaveBeenLastCalledWith(
        JSON.stringify({
          name: CLIENT_ID_CONNECTION_CONTROLLER,
          data: {
            clientId: 1,
          },
        }),
      );
    });

    it('shows popup on browser controller message', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      const desktopConnection = new DesktopConnection(notificationManagerMock);
      const remotePortMock = createRemotePortMock();

      desktopConnection.createStream(remotePortMock);

      await simulateWebSocketMessage(
        webSocketMock,
        JSON.stringify({
          name: CLIENT_ID_BROWSER_CONTROLLER,
          data: BROWSER_ACTION_SHOW_POPUP,
        }),
      );

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(1);
    });
  });
});

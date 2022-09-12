import ObjectMultiplex from 'obj-multiplex';
import PortStream from 'extension-port-stream';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  BROWSER_ACTION_SHOW_POPUP,
  CLIENT_ID_HANDSHAKES,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import DesktopConnection from './desktop-connection';
import {
  REMOTE_PORT_NAME_MOCK,
  REMOTE_PORT_SENDER_MOCK,
  createStreamMock,
  simulateStreamMessage,
  createRemotePortMock,
  createNotificationManagerMock,
  createMultiplexMock,
  simulateNodeEvent,
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
} from './test/utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import WebSocketStream from './web-socket-stream';
import cfg from './config';

jest.mock('./web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });

describe('Desktop Connection', () => {
  let webSocketMock;
  let webSocketStreamMock;
  let multiplexMock;
  let portStreamMock;
  let notificationManagerMock;
  let remotePortMock;
  let desktopConnection;
  const multiplexStreamMocks = {};

  beforeEach(() => {
    jest.resetAllMocks();

    multiplexMock = createMultiplexMock();
    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream;
    });

    webSocketStreamMock = createWebSocketStreamMock();
    webSocketStreamMock.pipe.mockReturnValue(multiplexMock);

    portStreamMock = createStreamMock();
    portStreamMock.pipe.mockImplementation((dest) => dest);

    webSocketMock = createWebSocketBrowserMock();
    notificationManagerMock = createNotificationManagerMock();
    remotePortMock = createRemotePortMock();

    ObjectMultiplex.mockReturnValue(multiplexMock);
    WebSocketStream.mockReturnValue(webSocketStreamMock);
    EncryptedWebSocketStream.mockReturnValue(webSocketStreamMock);
    PortStream.mockReturnValue(portStreamMock);
    jest.spyOn(global, 'WebSocket').mockImplementation(() => webSocketMock);

    desktopConnection = new DesktopConnection(notificationManagerMock);

    cfg().desktop.webSocket.disableEncryption = false;
  });

  describe('init', () => {
    it('creates encrypted web socket stream piped to multiplex if encryption enabled', () => {
      desktopConnection.init();

      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(1);
      expect(EncryptedWebSocketStream).toHaveBeenCalledWith(webSocketMock);

      expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

      expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
      expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
    });

    it('creates standard web socket stream piped to multiplex if encryption disabled', () => {
      cfg().desktop.webSocket.disableEncryption = true;

      desktopConnection.init();

      expect(WebSocketStream).toHaveBeenCalledTimes(1);
      expect(WebSocketStream).toHaveBeenCalledWith(webSocketMock);

      expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

      expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
      expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
    });

    it('creates multiplex streams', () => {
      desktopConnection.init();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(5);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_BROWSER_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_CONNECTION_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_HANDSHAKES,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(CLIENT_ID_STATE);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_DISABLE,
      );
    });
  });

  describe('createStream', () => {
    beforeEach(() => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock);
    });

    it('pipes remote port to new multiplex client stream', async () => {
      expect(PortStream).toHaveBeenCalledTimes(1);
      expect(PortStream).toHaveBeenCalledWith(remotePortMock);

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(6);
      expect(multiplexMock.createStream).toHaveBeenLastCalledWith(1);

      const clientStreamMock = multiplexStreamMocks[1];

      expect(portStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(portStreamMock.pipe).toHaveBeenCalledWith(clientStreamMock);

      expect(clientStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(clientStreamMock.pipe).toHaveBeenCalledWith(portStreamMock);
    });

    it('sends handshake to web socket stream', async () => {
      const handshakeStreamMock = multiplexStreamMocks[CLIENT_ID_HANDSHAKES];

      expect(handshakeStreamMock.write).toHaveBeenCalledTimes(1);
      expect(handshakeStreamMock.write).toHaveBeenCalledWith({
        clientId: 1,
        remotePort: {
          name: REMOTE_PORT_NAME_MOCK,
          sender: REMOTE_PORT_SENDER_MOCK,
        },
      });
    });

    it('sends connection close message on port stream disconnect', async () => {
      await simulateNodeEvent(portStreamMock, 'finish');

      const connectionControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_CONNECTION_CONTROLLER];

      expect(connectionControllerStreamMock.write).toHaveBeenLastCalledWith({
        clientId: 1,
      });
    });

    it('shows popup on browser controller message', async () => {
      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      await simulateStreamMessage(
        browserControllerStreamMock,
        BROWSER_ACTION_SHOW_POPUP,
      );

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(1);
    });
  });
});

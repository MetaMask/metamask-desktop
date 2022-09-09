import ObjectMultiplex from 'obj-multiplex';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import {
  BROWSER_ACTION_SHOW_POPUP,
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
} from '../../../shared/constants/desktop';
import Desktop from './desktop';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import WebSocketStream from './web-socket-stream';
import cfg from './config';
import { updateCheck } from './update-check';
import {
  CLIENT_ID_MOCK,
  CLIENT_ID_2_MOCK,
  HANDSHAKE_MOCK,
  PORT_MOCK,
  createStreamMock,
  simulateStreamMessage,
  createMultiplexMock,
  simulateNodeEvent,
  createWebSocketNodeMock,
  createWebSocketServer,
  createWebSocketStreamMock,
} from './test/utils';

jest.mock('./web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });

jest.mock(
  './update-check',
  () => ({ updateCheck: jest.fn(() => Promise.resolve()) }),
  { virtual: true },
);

jest.mock(
  'electron',
  () => ({ app: { whenReady: jest.fn() }, BrowserWindow: jest.fn() }),
  {
    virtual: true,
  },
);

jest.mock(
  'ws',
  () => ({
    Server: jest.fn(),
  }),
  { virtual: true },
);

describe('Desktop', () => {
  let webSocketMock;
  let webSocketStreamMock;
  let multiplexMock;
  let desktop;
  let webSocketServerMock;
  let connectRemoteMock;
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

    webSocketServerMock = createWebSocketServer();
    connectRemoteMock = jest.fn();
    webSocketMock = createWebSocketNodeMock();

    ObjectMultiplex.mockReturnValue(multiplexMock);
    WebSocketStream.mockReturnValue(webSocketStreamMock);
    EncryptedWebSocketStream.mockReturnValue(webSocketStreamMock);
    jest.spyOn(global, 'WebSocket').mockImplementation(() => webSocketMock);

    BrowserWindow.mockReturnValue({
      loadFile: jest.fn(() => Promise.resolve()),
      webContents: {
        send: jest.fn(),
      },
    });

    WebSocketServer.mockImplementation((_, cb) => {
      setImmediate(() => cb());
      return webSocketServerMock;
    });

    app.whenReady.mockResolvedValue({});

    desktop = new Desktop();
  });

  describe('init', () => {
    it('creates web socket server', async () => {
      cfg().desktop.webSocket.port = PORT_MOCK;

      await desktop.init();

      expect(WebSocketServer).toHaveBeenCalledTimes(1);
      expect(WebSocketServer).toHaveBeenCalledWith(
        { port: PORT_MOCK },
        expect.any(Function),
      );
    });

    it('creates multiplex streams', async () => {
      await desktop.init();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(3);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_BROWSER_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_CONNECTION_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_HANDSHAKES,
      );
    });

    it('checks for updates', async () => {
      await desktop.init();
      expect(updateCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('showPopup', () => {
    it('writes to browser controller stream', async () => {
      await desktop.init();

      desktop.showPopup();

      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      expect(browserControllerStreamMock.write).toHaveBeenCalledTimes(1);
      expect(browserControllerStreamMock.write).toHaveBeenCalledWith(
        BROWSER_ACTION_SHOW_POPUP,
      );
    });
  });

  describe('on connection', () => {
    it('pipes encrypted web socket stream to multiplex stream if encryption enabled', async () => {
      await desktop.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(1);
      expect(EncryptedWebSocketStream).toHaveBeenCalledWith(webSocketMock);

      expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

      expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
      expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
    });

    it('pipes standard web socket stream to multiplex stream if encryption disabled', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      await desktop.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(WebSocketStream).toHaveBeenCalledTimes(1);
      expect(WebSocketStream).toHaveBeenCalledWith(webSocketMock);

      expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

      expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
      expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
    });

    it('checks for updates', async () => {
      await desktop.init();
      expect(updateCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('on disconnect', () => {
    it('ends all multiplex client streams', async () => {
      await desktop.init(connectRemoteMock);

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      const handshakeStreamMock = multiplexStreamMocks[CLIENT_ID_HANDSHAKES];
      await simulateStreamMessage(handshakeStreamMock, HANDSHAKE_MOCK);
      await simulateStreamMessage(handshakeStreamMock, {
        ...HANDSHAKE_MOCK,
        clientId: CLIENT_ID_2_MOCK,
      });

      await simulateNodeEvent(webSocketMock, 'close');

      expect(multiplexStreamMocks[CLIENT_ID_MOCK].end).toHaveBeenCalledTimes(1);
      expect(multiplexStreamMocks[CLIENT_ID_2_MOCK].end).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('on handshake', () => {
    it('creates background connection using new multiplex stream', async () => {
      await desktop.init(connectRemoteMock);

      const handshakeStreamMock = multiplexStreamMocks[CLIENT_ID_HANDSHAKES];

      await simulateStreamMessage(handshakeStreamMock, HANDSHAKE_MOCK);

      expect(multiplexMock.createStream).toHaveBeenLastCalledWith(
        CLIENT_ID_MOCK,
      );

      const newClientStream = multiplexStreamMocks[CLIENT_ID_MOCK];

      expect(connectRemoteMock).toHaveBeenCalledTimes(1);
      expect(connectRemoteMock).toHaveBeenCalledWith({
        ...HANDSHAKE_MOCK.remotePort,
        stream: newClientStream,
        onMessage: {
          addListener: expect.any(Function),
        },
      });
    });
  });

  describe('on connection controller message', () => {
    it('ends multiplex client stream', async () => {
      await desktop.init(connectRemoteMock);

      const handshakeStreamMock = multiplexStreamMocks[CLIENT_ID_HANDSHAKES];
      await simulateStreamMessage(handshakeStreamMock, HANDSHAKE_MOCK);

      const connectionControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_CONNECTION_CONTROLLER];

      await simulateStreamMessage(connectionControllerStreamMock, {
        clientId: CLIENT_ID_MOCK,
      });

      const clientStreamMock = multiplexStreamMocks[CLIENT_ID_MOCK];
      expect(clientStreamMock.end).toHaveBeenCalledTimes(1);
    });
  });
});

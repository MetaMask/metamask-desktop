import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_DISABLE,
  CLIENT_ID_HANDSHAKES,
  CLIENT_ID_STATE,
} from '../../../shared/constants/desktop';
import Desktop from './desktop';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { NodeWebSocket, WebSocketStream } from './web-socket-stream';
import cfg from './config';
import { updateCheck } from './update-check';
import {
  CLIENT_ID_MOCK,
  CLIENT_ID_2_MOCK,
  HANDSHAKE_MOCK,
  PORT_MOCK,
  DATA_MOCK,
  createStreamMock,
  simulateStreamMessage,
  createMultiplexMock,
  simulateNodeEvent,
  createWebSocketNodeMock,
  createWebSocketServer,
  createWebSocketStreamMock,
} from './test/utils';
import { browser } from './extension-polyfill';
import { ClientId } from './types/desktop';
import { BrowserControllerAction } from './types/message';

jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });

jest.mock('./web-socket-stream', () => ({ WebSocketStream: jest.fn() }), {
  virtual: true,
});

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

jest.mock(
  './extension-polyfill',
  () => ({
    browser: { storage: { local: { get: jest.fn(), set: jest.fn() } } },
  }),
  {
    virtual: true,
  },
);

describe('Desktop', () => {
  let webSocketMock: jest.Mocked<NodeWebSocket>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let multiplexMock: jest.Mocked<ObjectMultiplex & Duplex>;
  let webSocketServerMock: jest.Mocked<WebSocketServer>;
  let connectRemoteMock: jest.Mocked<any>;
  let backgroundInitialiseMock: jest.Mocked<any>;
  let objectMultiplexConstructorMock: jest.Mocked<any>;
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let encryptedWebSocketStreamConstructorMock: jest.Mocked<any>;
  let browserWindowConstructorMock: jest.Mocked<any>;
  let webSocketServerConstructorMock: jest.Mocked<any>;
  let appMock: jest.Mocked<typeof app>;
  let updateCheckMock: jest.Mocked<any>;
  let browserMock: jest.Mocked<any>;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktop: Desktop;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketMock = createWebSocketNodeMock();
    webSocketStreamMock = createWebSocketStreamMock();
    multiplexMock = createMultiplexMock();
    webSocketServerMock = createWebSocketServer();
    connectRemoteMock = jest.fn();
    backgroundInitialiseMock = jest.fn();
    objectMultiplexConstructorMock = ObjectMultiplex;
    webSocketStreamConstructorMock = WebSocketStream;
    encryptedWebSocketStreamConstructorMock = EncryptedWebSocketStream;
    browserWindowConstructorMock = BrowserWindow;
    webSocketServerConstructorMock = WebSocketServer;
    appMock = app as any;
    updateCheckMock = updateCheck;
    browserMock = browser;

    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

    webSocketStreamMock.pipe.mockReturnValue(multiplexMock as any);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock,
    );

    jest
      .spyOn(global, 'WebSocket')
      .mockImplementation(() => webSocketMock as any);

    browserWindowConstructorMock.mockReturnValue({
      loadFile: jest.fn(() => Promise.resolve()),
      webContents: {
        send: jest.fn(),
      },
    });

    webSocketServerConstructorMock.mockImplementation(
      (_: any, cb: () => void) => {
        setImmediate(() => cb());
        return webSocketServerMock;
      },
    );

    appMock.whenReady.mockResolvedValue();

    desktop = new Desktop(backgroundInitialiseMock);
  });

  describe('init', () => {
    it('creates web socket server', async () => {
      cfg().desktop.webSocket.port = PORT_MOCK;

      await desktop.init();

      expect(webSocketServerConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketServerConstructorMock).toHaveBeenCalledWith(
        { port: PORT_MOCK },
        expect.any(Function),
      );
    });

    it('creates multiplex streams', async () => {
      await desktop.init();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(5);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_BROWSER_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_CONNECTION_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(CLIENT_ID_STATE);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_DISABLE,
      );
    });

    it('checks for updates', async () => {
      await desktop.init();
      expect(updateCheckMock).toHaveBeenCalledTimes(1);
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
        BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP,
      );
    });
  });

  describe('disable', () => {
    it('writes state to disable stream', async () => {
      browserMock.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: true } },
      });

      await desktop.init();
      await desktop.disable();

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(1);
      expect(disableStreamMock.write).toHaveBeenCalledWith({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: false } },
      });
    });
  });

  describe('on connection', () => {
    it('pipes encrypted web socket stream to multiplex stream if encryption enabled', async () => {
      await desktop.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(encryptedWebSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(encryptedWebSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );

      expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

      expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
      expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
    });

    it('pipes standard web socket stream to multiplex stream if encryption disabled', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      await desktop.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(webSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );

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
      await desktop.init();
      desktop.setConnectCallbacks(connectRemoteMock, connectRemoteMock);

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
      await desktop.init();
      desktop.setConnectCallbacks(connectRemoteMock, connectRemoteMock);

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
      await desktop.init();
      desktop.setConnectCallbacks(connectRemoteMock, connectRemoteMock);

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

  describe('on extension state message', () => {
    beforeEach(async () => {
      await desktop.init();

      const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
      await simulateStreamMessage(stateStreamMock, DATA_MOCK);
    });

    it('updates state', async () => {
      expect(browserMock.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith(DATA_MOCK);
    });

    it('initialses background script', async () => {
      expect(backgroundInitialiseMock).toHaveBeenCalledTimes(1);
    });
  });
});

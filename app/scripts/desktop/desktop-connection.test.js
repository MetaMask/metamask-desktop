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
  DATA_MOCK,
  createStreamMock,
  simulateStreamMessage,
  createRemotePortMock,
  createNotificationManagerMock,
  createMultiplexMock,
  simulateNodeEvent,
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  simulateBrowserEvent,
} from './test/utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import WebSocketStream from './web-socket-stream';
import cfg from './config';
import { browser } from './extension-polyfill';

jest.mock('./web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });

jest.mock(
  './extension-polyfill',
  () => ({
    browser: {
      storage: { local: { get: jest.fn(), set: jest.fn() } },
      runtime: { reload: jest.fn() },
    },
  }),
  {
    virtual: true,
  },
);

describe('Desktop Connection', () => {
  let webSocketMock;
  let webSocketStreamMock;
  let multiplexMock;
  let portStreamMock;
  let notificationManagerMock;
  let remotePortMock;
  let desktopConnection;
  const multiplexStreamMocks = {};
  const isExternalFalse = false;

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
    it.each([
      ['encrypted', 'enabled', EncryptedWebSocketStream, false],
      ['standard', 'disabled', WebSocketStream, true],
    ])(
      'creates %s web socket stream piped to multiplex if encryption %s',
      async (_, __, webSocketConstructor, disableEncryption) => {
        cfg().desktop.webSocket.disableEncryption = disableEncryption;

        desktopConnection.init();
        desktopConnection.createStream(remotePortMock, isExternalFalse);

        expect(webSocketConstructor).toHaveBeenCalledTimes(1);
        expect(webSocketConstructor).toHaveBeenCalledWith(webSocketMock);

        expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
        expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

        expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
        expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
      },
    );

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

  describe.each([
    { isExternal: false, connectionType: `remote connection` },
    { isExternal: true, connectionType: `external connection` },
  ])(`createStream for $connectionType`, (isExternal) => {
    it('pipes remote port to new multiplex client stream', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternal);

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
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternal);

      const handshakeStreamMock = multiplexStreamMocks[CLIENT_ID_HANDSHAKES];

      expect(handshakeStreamMock.write).toHaveBeenCalledTimes(1);
      expect(handshakeStreamMock.write).toHaveBeenCalledWith({
        clientId: 1,
        isExternal,
        remotePort: {
          name: REMOTE_PORT_NAME_MOCK,
          sender: REMOTE_PORT_SENDER_MOCK,
        },
      });
    });

    describe('if web socket disconnected', () => {
      it.each([
        ['encrypted', 'enabled', EncryptedWebSocketStream, false],
        ['standard', 'disabled', WebSocketStream, true],
      ])(
        'creates %s web socket stream piped to multiplex if encryption %s',
        async (_, __, webSocketConstructor, disableEncryption) => {
          cfg().desktop.webSocket.disableEncryption = disableEncryption;

          desktopConnection.init();
          await simulateBrowserEvent(webSocketMock, 'close');

          desktopConnection.createStream(remotePortMock, isExternal);

          expect(webSocketConstructor).toHaveBeenCalledTimes(2);
          expect(webSocketConstructor).toHaveBeenLastCalledWith(webSocketMock);

          expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(2);
          expect(webSocketStreamMock.pipe).toHaveBeenLastCalledWith(
            multiplexMock,
          );

          expect(multiplexMock.pipe).toHaveBeenCalledTimes(2);
          expect(multiplexMock.pipe).toHaveBeenLastCalledWith(
            webSocketStreamMock,
          );
        },
      );
    });
  });

  describe('transferState', () => {
    it('writes state to state stream', async () => {
      browser.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: false } },
      });

      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternalFalse);

      await desktopConnection.transferState();

      const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];

      expect(stateStreamMock.write).toHaveBeenCalledTimes(1);
      expect(stateStreamMock.write).toHaveBeenCalledWith({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: true } },
      });
    });
  });

  describe('on port stream disconnect', () => {
    it('sends connection close message', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternalFalse);

      await simulateNodeEvent(portStreamMock, 'finish');

      const connectionControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_CONNECTION_CONTROLLER];

      expect(connectionControllerStreamMock.write).toHaveBeenLastCalledWith({
        clientId: 1,
      });
    });
  });

  describe('on browser controller message', () => {
    it('shows popup', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternalFalse);

      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      await simulateStreamMessage(
        browserControllerStreamMock,
        BROWSER_ACTION_SHOW_POPUP,
      );

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(1);
    });

    it('does nothing if action not recognised', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternalFalse);

      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      await simulateStreamMessage(browserControllerStreamMock, 'invalidAction');

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(0);
    });
  });

  describe('on disable message', () => {
    beforeEach(async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock, isExternalFalse);

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];
      await simulateStreamMessage(disableStreamMock, DATA_MOCK);
    });

    it('updates state', async () => {
      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browser.storage.local.set).toHaveBeenCalledWith(DATA_MOCK);
    });

    it('restarts extension', async () => {
      expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
    });
  });
});

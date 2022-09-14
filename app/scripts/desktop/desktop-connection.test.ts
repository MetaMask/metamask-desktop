import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import PortStream from 'extension-port-stream';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_CONNECTION_CONTROLLER,
  CLIENT_ID_HANDSHAKES,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import NotificationManager from '../lib/notification-manager';
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
import { WebSocketStream, BrowserWebSocket } from './web-socket-stream';
import cfg from './config';
import { browser } from './extension-polyfill';
import { RemotePort } from './types/background';
import { ClientId } from './types/desktop';
import { BrowserControllerAction } from './types/message';

jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });

jest.mock('./web-socket-stream', () => ({ WebSocketStream: jest.fn() }), {
  virtual: true,
});

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
  let webSocketMock: jest.Mocked<BrowserWebSocket>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let multiplexMock: jest.Mocked<ObjectMultiplex & Duplex>;
  let portStreamMock: jest.Mocked<Duplex>;
  let notificationManagerMock: jest.Mocked<NotificationManager>;
  let remotePortMock: jest.Mocked<RemotePort>;
  let objectMultiplexConstructorMock: jest.Mocked<any>;
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let encryptedWebSocketStreamConstructorMock: jest.Mocked<any>;
  let portStreamConstructorMock: jest.Mocked<any>;
  let browserMock: jest.Mocked<any>;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktopConnection: DesktopConnection;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketMock = createWebSocketBrowserMock();
    webSocketStreamMock = createWebSocketStreamMock();
    multiplexMock = createMultiplexMock();
    portStreamMock = createStreamMock();
    notificationManagerMock = createNotificationManagerMock();
    remotePortMock = createRemotePortMock();
    objectMultiplexConstructorMock = ObjectMultiplex;
    webSocketStreamConstructorMock = WebSocketStream;
    encryptedWebSocketStreamConstructorMock = EncryptedWebSocketStream;
    portStreamConstructorMock = PortStream;
    browserMock = browser;

    webSocketStreamMock.pipe.mockReturnValue(multiplexMock);
    portStreamMock.pipe.mockImplementation((dest) => dest);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);
    portStreamConstructorMock.mockReturnValue(portStreamMock);
    jest.spyOn(global, 'WebSocket').mockImplementation(() => webSocketMock);

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock,
    );

    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

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
        desktopConnection.createStream(remotePortMock);

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

  describe('createStream', () => {
    it('pipes remote port to new multiplex client stream', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock);

      expect(portStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(portStreamConstructorMock).toHaveBeenCalledWith(remotePortMock);

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
      desktopConnection.createStream(remotePortMock);

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

          desktopConnection.createStream(remotePortMock);

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
      browserMock.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: false } },
      });

      desktopConnection.init();
      desktopConnection.createStream(remotePortMock);

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
      desktopConnection.createStream(remotePortMock);

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
      desktopConnection.createStream(remotePortMock);

      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      await simulateStreamMessage(
        browserControllerStreamMock,
        BrowserControllerAction.BROWSER_ACTION_SHOW_POPUP,
      );

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(1);
    });

    it('does nothing if action not recognised', async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock);

      const browserControllerStreamMock =
        multiplexStreamMocks[CLIENT_ID_BROWSER_CONTROLLER];

      await simulateStreamMessage(browserControllerStreamMock, 'invalidAction');

      expect(notificationManagerMock.showPopup).toHaveBeenCalledTimes(0);
    });
  });

  describe('on disable message', () => {
    beforeEach(async () => {
      desktopConnection.init();
      desktopConnection.createStream(remotePortMock);

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

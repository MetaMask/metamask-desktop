import { Duplex, EventEmitter } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_DISABLE,
  CLIENT_ID_NEW_CONNECTION,
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
  NEW_CONNECTION_MESSAGE_MOCK,
  PORT_MOCK,
  DATA_MOCK,
  createStreamMock,
  createMultiplexMock,
  createWebSocketNodeMock,
  createWebSocketServerMock,
  createWebSocketStreamMock,
  createEventEmitterMock,
  DATA_2_MOCK,
} from './test/mocks';
import { simulateStreamMessage, simulateNodeEvent } from './test/utils';
import { browser } from './browser/browser-polyfill';
import { ClientId } from './types/desktop';
import { ConnectionType } from './types/background';

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
  () => ({
    app: { whenReady: jest.fn() },
    BrowserWindow: jest.fn(),
    ipcMain: { handle: jest.fn() },
  }),
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
  './browser/browser-polyfill',
  () => ({
    browser: { storage: { local: { get: jest.fn(), set: jest.fn() } } },
  }),
  {
    virtual: true,
  },
);

const removeInstance = () => {
  // eslint-disable-next-line
  // @ts-ignore
  Desktop.instance = undefined;
};

describe('Desktop', () => {
  let webSocketMock: jest.Mocked<NodeWebSocket>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let multiplexMock: jest.Mocked<ObjectMultiplex & Duplex>;
  let webSocketServerMock: jest.Mocked<WebSocketServer>;
  let connectRemoteMock: jest.Mocked<any>;
  let connectExternalMock: jest.Mocked<any>;
  let backgroundInitialiseMock: jest.Mocked<any>;
  let objectMultiplexConstructorMock: jest.Mocked<any>;
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let encryptedWebSocketStreamConstructorMock: jest.Mocked<any>;
  let browserWindowConstructorMock: jest.Mocked<any>;
  let webSocketServerConstructorMock: jest.Mocked<any>;
  let appMock: jest.Mocked<typeof app>;
  let updateCheckMock: jest.Mocked<any>;
  let browserMock: jest.Mocked<any>;
  let metaMaskController: jest.Mocked<EventEmitter>;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktop: Desktop;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketMock = createWebSocketNodeMock();
    webSocketStreamMock = createWebSocketStreamMock();
    multiplexMock = createMultiplexMock();
    webSocketServerMock = createWebSocketServerMock();
    connectRemoteMock = jest.fn();
    connectExternalMock = jest.fn();
    backgroundInitialiseMock = jest.fn();
    objectMultiplexConstructorMock = ObjectMultiplex;
    webSocketStreamConstructorMock = WebSocketStream;
    encryptedWebSocketStreamConstructorMock = EncryptedWebSocketStream;
    browserWindowConstructorMock = BrowserWindow;
    webSocketServerConstructorMock = WebSocketServer;
    appMock = app as any;
    updateCheckMock = updateCheck;
    browserMock = browser;
    metaMaskController = createEventEmitterMock();

    browserMock.storage.local.get.mockResolvedValue({
      ...DATA_MOCK,
      data: { PreferencesController: { desktopEnabled: true } },
    });

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

    removeInstance();

    desktop = Desktop.newInstance(backgroundInitialiseMock);
  });

  describe('static init', () => {
    beforeEach(() => {
      removeInstance();
    });

    it('creates and initialises', async () => {
      await Desktop.init(backgroundInitialiseMock);

      expect(Desktop.getInstance()).toBeDefined();
      expect(webSocketServerConstructorMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('newInstance', () => {
    beforeEach(() => {
      removeInstance();
    });

    it('creates a new instance if none exists', () => {
      expect(Desktop.getInstance()).toBeUndefined();

      const instance = Desktop.newInstance(backgroundInitialiseMock);

      expect(Desktop.getInstance()).toBeDefined();
      expect(Desktop.getInstance()).toBe(instance);
    });

    it('returns old instance if one already exists', () => {
      expect(Desktop.getInstance()).toBeUndefined();

      const firstInstance = Desktop.newInstance(backgroundInitialiseMock);
      const secondInstance = Desktop.newInstance(backgroundInitialiseMock);

      expect(Desktop.getInstance()).toBeDefined();
      expect(Desktop.getInstance()).toBe(firstInstance);
      expect(secondInstance).toBe(firstInstance);
    });
  });

  describe('hasInstance', () => {
    beforeEach(() => {
      removeInstance();
    });

    it('returns false if no instance created', () => {
      expect(Desktop.hasInstance()).toBe(false);
    });

    it('returns true if instance created', () => {
      Desktop.newInstance(backgroundInitialiseMock);
      expect(Desktop.hasInstance()).toBe(true);
    });
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

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(6);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_BROWSER_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_END_CONNECTION,
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

  describe('on state update', () => {
    const simulateStateUpdate = async (
      state: any,
      afterInitialStateTransfer: boolean,
    ) => {
      browserMock.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: true } },
      });

      desktop.registerCallbacks(
        connectRemoteMock,
        connectExternalMock,
        metaMaskController,
      );

      await desktop.init();

      if (afterInitialStateTransfer) {
        await simulateNodeEvent(
          webSocketServerMock,
          'connection',
          webSocketMock,
        );
        const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
        await simulateStreamMessage(stateStreamMock, DATA_MOCK);
      }

      await simulateNodeEvent(metaMaskController, 'update', state);
    };

    it('writes state to disable stream if desktop disabled', async () => {
      await simulateStateUpdate({ desktopEnabled: false }, true);

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(1);
      expect(disableStreamMock.write).toHaveBeenCalledWith({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: false } },
      });
    });

    it('does nothing if desktop enabled', async () => {
      await simulateStateUpdate({ desktopEnabled: true }, true);

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(0);
    });

    it('does nothing if desktop state has not yet been initiated with the extension state', async () => {
      await simulateStateUpdate({ desktopEnabled: false }, false);

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(0);
    });
  });

  describe('transferState', () => {
    let stateStreamMock;

    beforeEach(async () => {
      await desktop.init();
      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
    });

    describe('after desktop state being initialized by extension', () => {
      beforeEach(async () => {
        await simulateStreamMessage(stateStreamMock, DATA_2_MOCK);
      });

      it('writes state to state stream', async () => {
        desktop.transferState(DATA_MOCK);

        expect(stateStreamMock.write).toHaveBeenCalledTimes(1);
        expect(stateStreamMock.write).toHaveBeenCalledWith(DATA_MOCK);
      });
    });

    describe('before desktop state being initialized by extension', () => {
      it('does nothing', async () => {
        desktop.transferState(DATA_MOCK);

        expect(stateStreamMock.write).toHaveBeenCalledTimes(0);
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
      desktop.registerCallbacks(
        connectRemoteMock,
        connectExternalMock,
        metaMaskController,
      );

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      const newConnectionStreamMock =
        multiplexStreamMocks[CLIENT_ID_NEW_CONNECTION];
      await simulateStreamMessage(
        newConnectionStreamMock,
        NEW_CONNECTION_MESSAGE_MOCK,
      );
      await simulateStreamMessage(newConnectionStreamMock, {
        ...NEW_CONNECTION_MESSAGE_MOCK,
        clientId: CLIENT_ID_2_MOCK,
      });

      await simulateNodeEvent(webSocketMock, 'close');

      expect(multiplexStreamMocks[CLIENT_ID_MOCK].end).toHaveBeenCalledTimes(1);
      expect(multiplexStreamMocks[CLIENT_ID_2_MOCK].end).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('on new connection message', () => {
    it.each([
      {
        name: 'internal',
        connectionType: ConnectionType.INTERNAL,
        callback: () => connectRemoteMock,
      },
      {
        name: 'external',
        connectionType: ConnectionType.EXTERNAL,
        callback: () => connectExternalMock,
      },
    ])(
      'creates background $name connection using new multiplex stream',
      async ({ connectionType, callback }) => {
        await desktop.init();
        desktop.registerCallbacks(
          connectRemoteMock,
          connectExternalMock,
          metaMaskController,
        );

        const newConnectionStreamMock =
          multiplexStreamMocks[CLIENT_ID_NEW_CONNECTION];

        await simulateStreamMessage(newConnectionStreamMock, {
          ...NEW_CONNECTION_MESSAGE_MOCK,
          connectionType,
        });

        expect(multiplexMock.createStream).toHaveBeenLastCalledWith(
          CLIENT_ID_MOCK,
        );

        const newClientStream = multiplexStreamMocks[CLIENT_ID_MOCK];

        expect(callback()).toHaveBeenCalledTimes(1);
        expect(callback()).toHaveBeenCalledWith({
          ...NEW_CONNECTION_MESSAGE_MOCK.remotePort,
          stream: newClientStream,
          onMessage: {
            addListener: expect.any(Function),
          },
        });
      },
    );
  });

  describe('on end connection message', () => {
    it('ends multiplex client stream', async () => {
      await desktop.init();
      desktop.registerCallbacks(
        connectRemoteMock,
        connectExternalMock,
        metaMaskController,
      );

      const newConnectionStreamMock =
        multiplexStreamMocks[CLIENT_ID_NEW_CONNECTION];
      await simulateStreamMessage(
        newConnectionStreamMock,
        NEW_CONNECTION_MESSAGE_MOCK,
      );

      const endConnectionStreamMock =
        multiplexStreamMocks[CLIENT_ID_END_CONNECTION];

      await simulateStreamMessage(endConnectionStreamMock, {
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

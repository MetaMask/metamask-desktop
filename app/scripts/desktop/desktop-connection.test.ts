import { Duplex, PassThrough } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import PortStream from 'extension-port-stream';
import { v4 as uuidv4 } from 'uuid';
import {
  CLIENT_ID_BROWSER_CONTROLLER,
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
} from '../../../shared/constants/desktop';
import DesktopConnection from './desktop-connection';
import {
  REMOTE_PORT_NAME_MOCK,
  REMOTE_PORT_SENDER_MOCK,
  DATA_MOCK,
  createStreamMock,
  createRemotePortMock,
  createMultiplexMock,
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  createEventEmitterMock,
  JSON_RPC_ID_MOCK,
  STREAM_MOCK,
  UUID_MOCK,
} from './test/mocks';
import {
  simulateStreamMessage,
  simulateNodeEvent,
  simulateBrowserEvent,
  flushPromises,
} from './test/utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { WebSocketStream, BrowserWebSocket } from './web-socket-stream';
import cfg from './config';
import { browser } from './browser/browser-polyfill';
import { ConnectionType, RemotePort } from './types/background';
import { ClientId } from './types/desktop';

jest.mock('./encrypted-web-socket-stream', () => jest.fn(), { virtual: true });
jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream', () => jest.fn(), { virtual: true });
jest.mock('uuid');

jest.mock('stream', () => ({ Duplex: jest.fn(), PassThrough: jest.fn() }), {
  virtual: true,
});

jest.mock('./web-socket-stream', () => ({ WebSocketStream: jest.fn() }), {
  virtual: true,
});

jest.mock(
  './browser/browser-polyfill',
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

const removeInstance = () => {
  // eslint-disable-next-line
  // @ts-ignore
  DesktopConnection.instance = undefined;
};

describe('Desktop Connection', () => {
  let webSocketMock: jest.Mocked<BrowserWebSocket>;
  let webSocketStreamMock: jest.Mocked<WebSocketStream>;
  let multiplexMock: jest.Mocked<ObjectMultiplex & Duplex>;
  let portStreamMock: jest.Mocked<Duplex>;
  let remotePortMock: jest.Mocked<RemotePort>;
  let objectMultiplexConstructorMock: jest.Mocked<any>;
  let webSocketStreamConstructorMock: jest.Mocked<any>;
  let encryptedWebSocketStreamConstructorMock: jest.Mocked<any>;
  let portStreamConstructorMock: jest.Mocked<any>;
  let browserMock: jest.Mocked<any>;
  let passThroughConstructorMock: jest.Mocked<any>;
  let passThroughMock: jest.Mocked<Duplex>;
  let uuidMock: jest.MockedFunction<typeof uuidv4>;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktopConnection: DesktopConnection;

  const initDesktopConnection = async () => {
    const initPromise = desktopConnection.init();

    await flushPromises();
    await simulateBrowserEvent(webSocketMock, 'open');
    await initPromise;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketMock = createWebSocketBrowserMock();
    webSocketStreamMock = createWebSocketStreamMock();
    multiplexMock = createMultiplexMock();
    portStreamMock = createStreamMock();
    remotePortMock = createRemotePortMock();
    objectMultiplexConstructorMock = ObjectMultiplex;
    webSocketStreamConstructorMock = WebSocketStream;
    encryptedWebSocketStreamConstructorMock = EncryptedWebSocketStream;
    portStreamConstructorMock = PortStream;
    browserMock = browser;
    passThroughConstructorMock = PassThrough;
    passThroughMock = createStreamMock();
    uuidMock = uuidv4 as any;

    webSocketStreamMock.pipe.mockReturnValue(multiplexMock);
    portStreamMock.pipe.mockImplementation((dest) => dest);
    passThroughMock.pipe.mockImplementation((dest) => dest);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);
    portStreamConstructorMock.mockReturnValue(portStreamMock);
    jest.spyOn(global, 'WebSocket').mockImplementation(() => webSocketMock);
    passThroughConstructorMock.mockReturnValue(passThroughMock);
    uuidMock.mockReturnValue(UUID_MOCK);

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock,
    );

    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

    removeInstance();

    desktopConnection = DesktopConnection.newInstance();

    cfg().desktop.webSocket.disableEncryption = false;
  });

  describe('initIfEnabled', () => {
    beforeEach(() => {
      removeInstance();
    });

    it.each([
      ['no state', undefined],
      [
        'desktop enabled in state',
        { PreferencesController: { desktopEnabled: true } },
      ],
    ])('creates and initialises if %s', async (_, state) => {
      const initPromise = DesktopConnection.initIfEnabled(state);

      await flushPromises();
      await simulateBrowserEvent(webSocketMock, 'open');
      await initPromise;

      expect(DesktopConnection.getInstance()).toBeDefined();
    });

    it('does nothing if desktop disabled in state', async () => {
      const initPromise = DesktopConnection.initIfEnabled({
        PreferencesController: { desktopEnabled: false },
      });

      await flushPromises();
      await simulateBrowserEvent(webSocketMock, 'open');
      await initPromise;

      expect(DesktopConnection.getInstance()).toBeUndefined();
    });
  });

  describe('newInstance', () => {
    beforeEach(() => {
      removeInstance();
    });

    it('creates a new instance if none exists', () => {
      expect(DesktopConnection.getInstance()).toBeUndefined();

      const instance = DesktopConnection.newInstance();

      expect(DesktopConnection.getInstance()).toBeDefined();
      expect(DesktopConnection.getInstance()).toBe(instance);
    });

    it('returns old instance if one already exists', () => {
      expect(DesktopConnection.getInstance()).toBeUndefined();

      const firstInstance = DesktopConnection.newInstance();
      const secondInstance = DesktopConnection.newInstance();

      expect(DesktopConnection.getInstance()).toBeDefined();
      expect(DesktopConnection.getInstance()).toBe(firstInstance);
      expect(secondInstance).toBe(firstInstance);
    });
  });

  describe('hasInstance', () => {
    beforeEach(() => {
      removeInstance();
    });

    it('returns false if no instance created', () => {
      expect(DesktopConnection.hasInstance()).toBe(false);
    });

    it('returns true if instance created', () => {
      DesktopConnection.newInstance();
      expect(DesktopConnection.hasInstance()).toBe(true);
    });
  });

  describe('init', () => {
    it.each([
      ['encrypted', 'enabled', EncryptedWebSocketStream, false],
      ['standard', 'disabled', WebSocketStream, true],
    ])(
      'creates %s web socket stream piped to multiplex if encryption %s',
      async (_, __, webSocketConstructor, disableEncryption) => {
        cfg().desktop.webSocket.disableEncryption = disableEncryption;

        await initDesktopConnection();
        desktopConnection.createStream(remotePortMock, ConnectionType.INTERNAL);

        expect(webSocketConstructor).toHaveBeenCalledTimes(1);
        expect(webSocketConstructor).toHaveBeenCalledWith(webSocketMock);

        expect(webSocketStreamMock.pipe).toHaveBeenCalledTimes(1);
        expect(webSocketStreamMock.pipe).toHaveBeenCalledWith(multiplexMock);

        expect(multiplexMock.pipe).toHaveBeenCalledTimes(1);
        expect(multiplexMock.pipe).toHaveBeenCalledWith(webSocketStreamMock);
      },
    );

    it('creates multiplex streams', async () => {
      await initDesktopConnection();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(5);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_BROWSER_CONTROLLER,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_END_CONNECTION,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_NEW_CONNECTION,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledWith(CLIENT_ID_STATE);
      expect(multiplexMock.createStream).toHaveBeenCalledWith(
        CLIENT_ID_DISABLE,
      );
    });

    it('throws if timeout waiting for web socket open', async () => {
      jest.useFakeTimers();

      const promise = desktopConnection.init();

      jest.runAllTimers();
      jest.useRealTimers();

      await expect(promise).rejects.toThrow(
        'Timeout connecting to web socket server',
      );
    });

    it('does nothing if already initialised', async () => {
      await initDesktopConnection();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(5);

      await desktopConnection.init();

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(5);
    });
  });

  describe.each([
    { connectionType: ConnectionType.INTERNAL, name: `Internal` },
    { connectionType: ConnectionType.EXTERNAL, name: `External` },
  ])('createStream - $name Connection', ({ connectionType }) => {
    it('pipes remote port to new multiplex client stream', async () => {
      await initDesktopConnection();
      desktopConnection.createStream(remotePortMock, connectionType);

      expect(portStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(portStreamConstructorMock).toHaveBeenCalledWith(remotePortMock);

      expect(multiplexMock.createStream).toHaveBeenCalledTimes(6);
      expect(multiplexMock.createStream).toHaveBeenLastCalledWith(UUID_MOCK);

      const clientStreamMock = multiplexStreamMocks[UUID_MOCK];

      expect(portStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(portStreamMock.pipe).toHaveBeenCalledWith(passThroughMock);

      expect(passThroughMock.pipe).toHaveBeenCalledTimes(1);
      expect(passThroughMock.pipe).toHaveBeenCalledWith(clientStreamMock);

      expect(clientStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(clientStreamMock.pipe).toHaveBeenCalledWith(portStreamMock);
    });

    it('sends new connection message to web socket stream', async () => {
      await initDesktopConnection();
      desktopConnection.createStream(remotePortMock, connectionType);

      const newConnectionStreamMock =
        multiplexStreamMocks[CLIENT_ID_NEW_CONNECTION];

      expect(newConnectionStreamMock.write).toHaveBeenCalledTimes(1);
      expect(newConnectionStreamMock.write).toHaveBeenCalledWith({
        clientId: UUID_MOCK,
        connectionType,
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

          await initDesktopConnection();
          await simulateBrowserEvent(webSocketMock, 'close');

          const createPromise = desktopConnection.createStream(
            remotePortMock,
            ConnectionType.INTERNAL,
          );

          await flushPromises();
          await simulateBrowserEvent(webSocketMock, 'open');
          await createPromise;

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

      await initDesktopConnection();
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

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
    it('sends end connection message', async () => {
      await initDesktopConnection();
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

      await simulateNodeEvent(portStreamMock, 'finish');

      const endConnectionStreamMock =
        multiplexStreamMocks[CLIENT_ID_END_CONNECTION];

      expect(endConnectionStreamMock.write).toHaveBeenLastCalledWith({
        clientId: UUID_MOCK,
      });
    });
  });

  describe('on disable message', () => {
    beforeEach(async () => {
      await initDesktopConnection();
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

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

  describe('on state update', () => {
    const simulateStateUpdate = async (updatedState: any) => {
      const metamaskControllerMock = createEventEmitterMock();

      browserMock.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { PreferencesController: { desktopEnabled: false } },
      });

      DesktopConnection.registerCallbacks(metamaskControllerMock);

      await simulateNodeEvent(metamaskControllerMock, 'update', updatedState);
      await simulateBrowserEvent(webSocketMock, 'open');
    };

    it('initialises if no instance and desktop enabled set to true', async () => {
      removeInstance();
      await simulateStateUpdate({ desktopEnabled: true });

      expect(DesktopConnection.getInstance()).toBeDefined();
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(1);
    });

    it('does nothing if instance exists and desktop enabled set to true', async () => {
      await simulateStateUpdate({ desktopEnabled: true });

      expect(DesktopConnection.getInstance()).toBeDefined();
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(0);
    });

    it('does nothing if no instance exists and desktop enabled set to false', async () => {
      removeInstance();
      await simulateStateUpdate({ desktopEnabled: false });

      expect(DesktopConnection.getInstance()).toBeUndefined();
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(0);
    });
  });

  describe('on state message', () => {
    beforeEach(async () => {
      await initDesktopConnection();
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

      const stateStreaMock = multiplexStreamMocks[CLIENT_ID_STATE];
      await simulateStreamMessage(stateStreaMock, DATA_MOCK);
    });

    it('updates state', async () => {
      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browser.storage.local.set).toHaveBeenCalledWith(DATA_MOCK);
    });
  });

  describe('on port stream message', () => {
    const generateRawState = (desktopEnabled: boolean) => ({
      data: {
        ...DATA_MOCK,
        PreferencesController: { desktopEnabled },
      },
    });

    const simulatePortStreaMessage = async (message: any) => {
      browserMock.storage.local.get.mockResolvedValue(generateRawState(true));

      await initDesktopConnection();
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

      await simulateStreamMessage(portStreamMock, message);
    };

    it('updates state and restarts if method is disableDesktop', async () => {
      await simulatePortStreaMessage({ data: { method: 'disableDesktop' } });

      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        generateRawState(false),
      );

      expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
    });

    it('sends response if method is getDesktopEnabled', async () => {
      await simulatePortStreaMessage({
        name: STREAM_MOCK,
        data: { id: JSON_RPC_ID_MOCK, method: 'getDesktopEnabled' },
      });

      expect(portStreamMock.write).toHaveBeenCalledTimes(1);
      expect(portStreamMock.write).toHaveBeenCalledWith({
        name: STREAM_MOCK,
        data: { jsonrpc: '2.0', id: JSON_RPC_ID_MOCK, result: true },
      });
    });
  });
});

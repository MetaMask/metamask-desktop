import { Duplex } from 'stream';
import PortStream from 'extension-port-stream';
import { WebSocketStream } from '@metamask/desktop';
import { browser } from '@metamask/desktop/dist/browser';
import {
  TestConnectionResult,
  ConnectionType,
} from '@metamask/desktop/dist/types';
import { cfg } from '@metamask/desktop/dist/utils/config';
import * as RawState from '@metamask/desktop/dist/utils/state';
import {
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  createDesktopConnectionMock,
  createRemotePortMock,
  createStreamMock,
  STREAM_MOCK,
  JSON_RPC_ID_MOCK,
} from '../test/mocks';
import {
  simulateBrowserEvent,
  flushPromises,
  simulateStreamMessage,
} from '../test/utils';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import DesktopConnection from './desktop-connection';
import DesktopManager from './desktop-manager';

jest.mock('extension-port-stream');
jest.mock('../encryption/encrypted-web-socket-stream');
jest.mock('./desktop-connection');

jest.mock('@metamask/desktop', () => ({
  WebSocketStream: jest.fn(),
}));

jest.mock('@metamask/desktop/dist/browser', () => ({
  browser: {
    runtime: { reload: jest.fn() },
  },
}));

jest.mock('@metamask/desktop/dist/utils/state', () => ({
  getDesktopState: jest.fn(),
  setDesktopState: jest.fn(),
}));

jest.mock('../../../../shared/modules/mv3.utils', () => ({}), {
  virtual: true,
});

jest.mock('../browser/browser-polyfill', () => ({}), {
  virtual: true,
});

const removeInstance = () => {
  // eslint-disable-next-line
  // @ts-ignore
  DesktopManager.desktopConnection = undefined;
};

const setInstance = (connection: DesktopConnection) => {
  // eslint-disable-next-line
  // @ts-ignore
  DesktopManager.desktopConnection = connection;
};

describe('Desktop Manager', () => {
  const webSocketMock = createWebSocketBrowserMock();
  const webSocketStreamMock = createWebSocketStreamMock();
  const desktopConnectionMock = createDesktopConnectionMock();
  const rawStateMock = RawState as jest.Mocked<typeof RawState>;
  const remotePortMock = createRemotePortMock();
  const portStreamMock = createStreamMock();
  const browserMock = browser as any;

  const webSocketStreamConstructorMock = WebSocketStream as jest.MockedClass<
    typeof WebSocketStream
  >;

  const encryptedWebSocketStreamConstructorMock =
    EncryptedWebSocketStream as jest.MockedClass<
      typeof EncryptedWebSocketStream
    >;

  const desktopConnectionConstructorMock =
    DesktopConnection as jest.MockedClass<typeof DesktopConnection>;

  const portStreamConstructorMock = PortStream as jest.MockedClass<
    typeof PortStream
  >;

  const initDesktopManager = async <T>(
    promise?: Promise<T>,
  ): Promise<T | void> => {
    const initPromise = promise || DesktopManager.init(undefined);

    await flushPromises();
    await simulateBrowserEvent(webSocketMock, 'open');
    await flushPromises();

    return await initPromise;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(global, 'WebSocket').mockImplementation(() => webSocketMock);
    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);
    desktopConnectionConstructorMock.mockReturnValue(desktopConnectionMock);
    portStreamConstructorMock.mockReturnValue(portStreamMock as any);

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock as any,
    );

    removeInstance();

    cfg().webSocket.disableEncryption = false;
  });

  describe('init', () => {
    const init = async (state: any) => {
      const promise = DesktopManager.init(state);
      await initDesktopManager(promise);
    };

    describe.each([
      ['enabled', 'encrypted', EncryptedWebSocketStream, false],
      ['disabled', 'standard', WebSocketStream, true],
    ])(
      'with encryption %s',
      (_, streamType, webSocketStreamConstructor, disableEncryption) => {
        beforeEach(async () => {
          cfg().webSocket.disableEncryption = disableEncryption;

          await init({
            DesktopController: {
              desktopEnabled: true,
              pairingKey: 'mockedKey',
            },
          });
        });

        it(`creates and inits ${streamType} web socket stream`, async () => {
          expect(webSocketStreamConstructor).toHaveBeenCalledTimes(1);
          expect(webSocketStreamConstructor).toHaveBeenCalledWith(
            webSocketMock,
          );

          expect(webSocketStreamMock.init).toHaveBeenCalledTimes(1);
        });

        it('creates desktop connection', async () => {
          expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(1);
          expect(desktopConnectionConstructorMock).toHaveBeenCalledWith(
            webSocketStreamMock,
          );
        });

        it('transfers state', async () => {
          expect(desktopConnectionMock.transferState).toHaveBeenCalledTimes(1);
        });
      },
    );

    it('does nothing if state has desktop disabled', async () => {
      await init({ DesktopController: { desktopEnabled: false } });

      expect(WebSocketStream).toHaveBeenCalledTimes(0);
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.init).toHaveBeenCalledTimes(0);
      expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('getConnection', () => {
    it('returns existing connection if desktop state enabled', async () => {
      DesktopManager.setState({ DesktopController: { desktopEnabled: true } });

      setInstance(desktopConnectionMock);

      expect(await DesktopManager.getConnection()).toBe(desktopConnectionMock);
    });

    it('creates connection if desktop state enabled and no existing connection', async () => {
      desktopConnectionMock.checkPairingKey.mockResolvedValue(true);
      DesktopManager.setState({ DesktopController: { desktopEnabled: true } });

      expect(await initDesktopManager(DesktopManager.getConnection())).toBe(
        desktopConnectionMock,
      );

      expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(1);
    });

    it('returns undefined if desktop not enabled', async () => {
      DesktopManager.setState({ DesktopController: { desktopEnabled: false } });

      expect(await DesktopManager.getConnection()).toBeUndefined();
    });
  });

  describe('isDesktopEnabled', () => {
    it.each([{ desktopEnabled: true }, { desktopEnabled: false }])(
      'returns $desktopEnabled if desktop state contains desktop enabled as $desktopEnabled',
      async ({ desktopEnabled }) => {
        DesktopManager.setState({
          DesktopController: { desktopEnabled },
        });

        expect(DesktopManager.isDesktopEnabled()).toBe(desktopEnabled);
      },
    );
  });

  describe('createStream', () => {
    it('gets connection and calls create stream if desktop enabled', async () => {
      DesktopManager.setState({ DesktopController: { desktopEnabled: true } });

      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      setInstance(desktopConnectionMock);

      await DesktopManager.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

      expect(desktopConnectionMock.createStream).toHaveBeenCalledTimes(1);
      expect(desktopConnectionMock.createStream).toHaveBeenCalledWith(
        remotePortMock,
        ConnectionType.INTERNAL,
        expect.any(Duplex),
      );
    });
  });

  describe('testConnection', () => {
    beforeEach(async () => {
      await DesktopManager.init(undefined);
    });

    const testConnection = async (): Promise<TestConnectionResult> => {
      const promise = DesktopManager.testConnection();
      const result = await initDesktopManager(promise);
      return result as any as Promise<TestConnectionResult>;
    };

    describe.each([
      ['enabled', 'encrypted', EncryptedWebSocketStream, false],
      ['disabled', 'standard', WebSocketStream, true],
    ])(
      'with encryption %s',
      (_, streamType, webSocketStreamConstructor, disableEncryption) => {
        beforeEach(async () => {
          cfg().webSocket.disableEncryption = disableEncryption;
        });

        it(`creates and inits ${streamType} web socket stream`, async () => {
          await testConnection();

          expect(webSocketStreamConstructor).toHaveBeenCalledTimes(1);
          expect(webSocketStreamConstructor).toHaveBeenCalledWith(
            webSocketMock,
          );

          expect(webSocketStreamMock.init).toHaveBeenCalledTimes(1);
        });

        it('creates desktop connection', async () => {
          await testConnection();

          expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(1);
          expect(desktopConnectionConstructorMock).toHaveBeenCalledWith(
            webSocketStreamMock,
          );
        });

        it('does not transfer state', async () => {
          await testConnection();
          expect(desktopConnectionMock.transferState).toHaveBeenCalledTimes(0);
        });
      },
    );
  });

  describe('on disconnect', () => {
    beforeEach(async () => {
      desktopConnectionMock.checkPairingKey.mockResolvedValue(true);
      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      await initDesktopManager(DesktopManager.getConnection());
      await simulateBrowserEvent(webSocketMock, 'close');
    });

    it('removes all listeners', async () => {
      expect(webSocketStreamMock.removeAllListeners).toHaveBeenCalledTimes(1);
      expect(desktopConnectionMock.removeAllListeners).toHaveBeenCalledTimes(1);
    });

    it('destroys stream', async () => {
      expect(webSocketStreamMock.destroy).toHaveBeenCalledTimes(1);
    });

    it('closes web socket', async () => {
      expect(webSocketMock.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('on UI message', () => {
    const simulatePortStreamMessage = async (message: any) => {
      DesktopManager.setState({ DesktopController: { desktopEnabled: true } });

      setInstance(desktopConnectionMock);

      await DesktopManager.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
      );

      await simulateStreamMessage(portStreamMock, message);
    };

    it('updates state and restarts if method is disableDesktopError', async () => {
      await simulatePortStreamMessage({
        data: { method: 'disableDesktopError' },
      });

      expect(rawStateMock.setDesktopState).toHaveBeenCalledTimes(1);
      expect(rawStateMock.setDesktopState).toHaveBeenCalledWith({
        desktopEnabled: false,
      });

      expect(browserMock.runtime.reload).toHaveBeenCalledTimes(1);
    });

    it('sends response if method is getDesktopEnabled', async () => {
      await simulatePortStreamMessage({
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

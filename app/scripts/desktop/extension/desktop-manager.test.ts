import { Duplex } from 'stream';
import {
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  createDesktopConnectionMock,
  createRemotePortMock,
} from '../test/mocks';
import { simulateBrowserEvent, flushPromises } from '../test/utils';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { WebSocketStream } from '../shared/web-socket-stream';
import cfg from '../utils/config';
import { TestConnectionResult } from '../types/desktop';
import * as RawState from '../utils/raw-state';
import { ConnectionType } from '../types/background';
import DesktopConnection from './desktop-connection';
import DesktopManager from './desktop-manager';

jest.mock('../shared/web-socket-stream');
jest.mock('../encryption/encrypted-web-socket-stream');
jest.mock('./desktop-connection');
jest.mock('../utils/raw-state');
jest.mock('../../../../shared/modules/mv3.utils', () => ({}), {
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

  const webSocketStreamConstructorMock = WebSocketStream as jest.MockedClass<
    typeof WebSocketStream
  >;

  const encryptedWebSocketStreamConstructorMock =
    EncryptedWebSocketStream as jest.MockedClass<
      typeof EncryptedWebSocketStream
    >;

  const desktopConnectionConstructorMock =
    DesktopConnection as jest.MockedClass<typeof DesktopConnection>;

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

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock as any,
    );

    removeInstance();

    cfg().desktop.webSocket.disableEncryption = false;
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
          cfg().desktop.webSocket.disableEncryption = disableEncryption;

          await init({ DesktopController: { desktopEnabled: true } });
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
      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      setInstance(desktopConnectionMock);

      expect(await DesktopManager.getConnection()).toBe(desktopConnectionMock);
    });

    it('creates connection if desktop state enabled and no existing connection', async () => {
      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      expect(await initDesktopManager(DesktopManager.getConnection())).toBe(
        desktopConnectionMock,
      );

      expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(1);
    });

    it('returns undefined if desktop not enabled', async () => {
      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: false,
      });

      expect(await DesktopManager.getConnection()).toBeUndefined();
    });
  });

  describe('createStream', () => {
    it('returns false if desktop not enabled', async () => {
      rawStateMock.getCachedDesktopState.mockReturnValueOnce({
        desktopEnabled: false,
      });

      const result = DesktopManager.createStream(
        createRemotePortMock(),
        ConnectionType.INTERNAL,
      );
      await flushPromises();

      expect(result).toBe(false);
    });

    it('returns true if desktop enabled', async () => {
      rawStateMock.getCachedDesktopState.mockReturnValueOnce({
        desktopEnabled: true,
      });

      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      const result = DesktopManager.createStream(
        createRemotePortMock(),
        ConnectionType.INTERNAL,
      );
      await flushPromises();

      expect(result).toBe(true);
    });

    it('gets connection and calls create stream if desktop enabled', async () => {
      rawStateMock.getCachedDesktopState.mockReturnValueOnce({
        desktopEnabled: true,
      });

      rawStateMock.getDesktopState.mockResolvedValueOnce({
        desktopEnabled: true,
      });

      setInstance(desktopConnectionMock);

      DesktopManager.createStream(remotePortMock, ConnectionType.INTERNAL);
      await flushPromises();

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
          cfg().desktop.webSocket.disableEncryption = disableEncryption;
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
});

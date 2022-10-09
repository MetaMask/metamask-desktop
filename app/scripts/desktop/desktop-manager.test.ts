import DesktopConnection from './desktop-connection';
import {
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  createEventEmitterMock,
  createDesktopConnectionMock,
} from './test/mocks';
import { simulateBrowserEvent, flushPromises } from './test/utils';
import EncryptedWebSocketStream from './encrypted-web-socket-stream';
import { WebSocketStream } from './web-socket-stream';
import cfg from './config';
import { TestConnectionResult } from './types/desktop';
import desktopManager from './desktop-manager';

jest.mock('./web-socket-stream');
jest.mock('./encrypted-web-socket-stream');
jest.mock('./desktop-connection');

const removeInstance = () => {
  // eslint-disable-next-line
  // @ts-ignore
  desktopManager.desktopConnection = undefined;
};

describe('Desktop Manager', () => {
  const webSocketMock = createWebSocketBrowserMock();
  const webSocketStreamMock = createWebSocketStreamMock();
  const backgroundMock = createEventEmitterMock();
  const desktopConnectionMock = createDesktopConnectionMock();

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
    const initPromise =
      promise || desktopManager.init(undefined, backgroundMock);

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
      const promise = desktopManager.init(state, backgroundMock);
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
            backgroundMock,
          );
        });

        it('transfers state', async () => {
          expect(desktopConnectionMock.transferState).toHaveBeenCalledTimes(1);
        });

        it('sets current connection', async () => {
          expect(desktopManager.getConnection()).toBe(desktopConnectionMock);
        });
      },
    );

    it('does nothing if state has desktop disabled', async () => {
      await init({ DesktopController: { desktopEnabled: false } });

      expect(WebSocketStream).toHaveBeenCalledTimes(0);
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.init).toHaveBeenCalledTimes(0);
      expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(0);
      expect(desktopManager.getConnection()).toBeUndefined();
    });
  });

  describe('testConnection', () => {
    beforeEach(async () => {
      await desktopManager.init(undefined, backgroundMock);
    });

    const testConnection = async (): Promise<TestConnectionResult> => {
      const promise = desktopManager.testConnection();
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
            backgroundMock,
          );
        });

        it('does not transfer state', async () => {
          await testConnection();
          expect(desktopConnectionMock.transferState).toHaveBeenCalledTimes(0);
        });

        it('does not set current connection', async () => {
          await testConnection();
          expect(desktopManager.getConnection()).toBeUndefined();
        });

        it('returns fail if desktop version below minimum', async () => {
          desktopConnectionMock.getDesktopVersion.mockResolvedValueOnce(-1);
          const result = await testConnection();
          expect(result.success).toBe(false);
        });

        it('returns success if desktop version valid', async () => {
          desktopConnectionMock.getDesktopVersion.mockResolvedValueOnce(2);
          const result = await testConnection();
          expect(result.success).toBe(true);
        });
      },
    );
  });
});

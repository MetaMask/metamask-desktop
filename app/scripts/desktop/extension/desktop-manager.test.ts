import {
  createWebSocketBrowserMock,
  createWebSocketStreamMock,
  createDesktopConnectionMock,
} from '../test/mocks';
import { simulateBrowserEvent, flushPromises } from '../test/utils';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { WebSocketStream } from '../shared/web-socket-stream';
import cfg from '../utils/config';
import { TestConnectionResult } from '../types/desktop';
import { browser } from '../browser/browser-polyfill';
import DesktopConnection from './desktop-connection';
import desktopManager from './desktop-manager';

jest.mock('../shared/web-socket-stream');
jest.mock('../encryption/encrypted-web-socket-stream');
jest.mock('./desktop-connection');
jest.mock('../../../../shared/modules/mv3.utils', () => ({}), {
  virtual: true,
});

jest.mock(
  '../browser/browser-polyfill',
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
  desktopManager.desktopConnection = undefined;
};

describe('Desktop Manager', () => {
  const webSocketMock = createWebSocketBrowserMock();
  const webSocketStreamMock = createWebSocketStreamMock();
  const desktopConnectionMock = createDesktopConnectionMock();
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

  const initDesktopManager = async <T>(
    promise?: Promise<T>,
  ): Promise<T | void> => {
    const initPromise = promise || desktopManager.init(undefined);

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
      const promise = desktopManager.init(state);
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

          browserMock.storage.local.get.mockResolvedValue({
            data: { DesktopController: { desktopEnabled: true } },
          });

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

        it('sets current connection', async () => {
          expect(await desktopManager.getConnection()).toBe(
            desktopConnectionMock,
          );
        });
      },
    );

    it('does nothing if state has desktop disabled', async () => {
      browserMock.storage.local.get.mockResolvedValue({
        data: { DesktopController: { desktopEnabled: false } },
      });

      await init({ DesktopController: { desktopEnabled: false } });

      expect(WebSocketStream).toHaveBeenCalledTimes(0);
      expect(EncryptedWebSocketStream).toHaveBeenCalledTimes(0);
      expect(webSocketStreamMock.init).toHaveBeenCalledTimes(0);
      expect(desktopConnectionConstructorMock).toHaveBeenCalledTimes(0);
      expect(await desktopManager.getConnection()).toBeUndefined();
    });
  });

  describe('testConnection', () => {
    beforeEach(async () => {
      await desktopManager.init(undefined);
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
          );
        });

        it('does not transfer state', async () => {
          await testConnection();
          expect(desktopConnectionMock.transferState).toHaveBeenCalledTimes(0);
        });
      },
    );
  });
});

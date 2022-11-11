import { app, BrowserWindow } from 'electron';
import { Server as WebSocketServer } from 'ws';
import EncryptedWebSocketStream from '../encryption/encrypted-web-socket-stream';
import { WebSocketStream } from '../shared/web-socket-stream';
import cfg from '../utils/config';
import {
  PORT_MOCK,
  createWebSocketNodeMock,
  createWebSocketServerMock,
  createWebSocketStreamMock,
  createEventEmitterMock,
  createExtensionConnectionMock,
} from '../test/mocks';
import { simulateNodeEvent } from '../test/utils';
import { browser } from '../browser/browser-polyfill';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';
import DesktopApp from './desktop-app';

jest.mock('extension-port-stream');
jest.mock('../shared/web-socket-stream');
jest.mock('../encryption/encrypted-web-socket-stream');
jest.mock('./extension-connection');

jest.mock(
  './update-check',
  () => ({ updateCheck: jest.fn(() => Promise.resolve()) }),
  { virtual: true },
);

jest.mock(
  'electron',
  () => ({
    app: { whenReady: jest.fn(), disableHardwareAcceleration: jest.fn() },
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
  '../browser/browser-polyfill',
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
  DesktopApp.instance = undefined;
};

describe('Desktop', () => {
  const browserWindowConstructorMock = BrowserWindow as any;
  const webSocketServerConstructorMock = WebSocketServer as any;
  const webSocketMock = createWebSocketNodeMock();
  const webSocketStreamMock = createWebSocketStreamMock();
  const webSocketServerMock = createWebSocketServerMock();
  const appMock = app as any;
  const extensionConnectionMock = createExtensionConnectionMock();
  const browserMock = browser as any;
  const pairingMock = createEventEmitterMock();

  const webSocketStreamConstructorMock = WebSocketStream as jest.MockedClass<
    typeof WebSocketStream
  >;

  const encryptedWebSocketStreamConstructorMock =
    EncryptedWebSocketStream as jest.MockedClass<
      typeof EncryptedWebSocketStream
    >;

  const extensionConnectionConstructorMock =
    ExtensionConnection as jest.MockedClass<typeof ExtensionConnection>;

  const updateCheckMock = updateCheck as jest.MockedFunction<
    typeof updateCheck
  >;

  beforeEach(() => {
    jest.resetAllMocks();

    webSocketStreamConstructorMock.mockReturnValue(webSocketStreamMock);
    extensionConnectionConstructorMock.mockReturnValue(extensionConnectionMock);
    extensionConnectionMock.getPairing.mockReturnValue(pairingMock as any);
    appMock.whenReady.mockResolvedValue();

    encryptedWebSocketStreamConstructorMock.mockReturnValue(
      webSocketStreamMock as any,
    );

    jest
      .spyOn(global, 'WebSocket')
      .mockImplementation(() => webSocketMock as any);

    browserWindowConstructorMock.mockReturnValue({
      loadFile: jest.fn(() => Promise.resolve()),
      webContents: {
        send: jest.fn(),
        setWindowOpenHandler: jest.fn(),
      },
    });

    webSocketServerConstructorMock.mockImplementation(
      (_: any, cb: () => void) => {
        setImmediate(() => cb());
        return webSocketServerMock;
      },
    );

    browserMock.storage.local.get.mockResolvedValue({});

    removeInstance();
  });

  describe('init', () => {
    it('creates web socket server', async () => {
      cfg().desktop.webSocket.port = PORT_MOCK;

      await DesktopApp.init();

      expect(webSocketServerConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketServerConstructorMock).toHaveBeenCalledWith(
        { port: PORT_MOCK },
        expect.any(Function),
      );
    });

    it('checks for updates', async () => {
      await DesktopApp.init();
      expect(updateCheckMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('on connection', () => {
    it('creates extension connection with encrypted web socket stream', async () => {
      await DesktopApp.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(encryptedWebSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(encryptedWebSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );

      expect(extensionConnectionConstructorMock).toHaveBeenCalledTimes(1);
      expect(extensionConnectionConstructorMock).toHaveBeenCalledWith(
        webSocketStreamMock,
      );

      expect(DesktopApp.getConnection()).toBe(extensionConnectionMock);
    });

    it('creates extension connection with standard web socket stream if encryption disabled', async () => {
      cfg().desktop.webSocket.disableEncryption = true;

      await DesktopApp.init();

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);

      expect(webSocketStreamConstructorMock).toHaveBeenCalledTimes(1);
      expect(webSocketStreamConstructorMock).toHaveBeenCalledWith(
        webSocketMock,
      );

      expect(extensionConnectionConstructorMock).toHaveBeenCalledTimes(1);
      expect(extensionConnectionConstructorMock).toHaveBeenCalledWith(
        webSocketStreamMock,
      );

      expect(DesktopApp.getConnection()).toBe(extensionConnectionMock);
    });
  });

  describe('on disconnect', () => {
    let restartEventListener;

    beforeEach(async () => {
      restartEventListener = jest.fn();

      await DesktopApp.init();

      DesktopApp.on('restart', restartEventListener);

      await simulateNodeEvent(webSocketServerMock, 'connection', webSocketMock);
      await simulateNodeEvent(webSocketMock, 'close');
    });

    it('removes all listeners', async () => {
      expect(webSocketStreamMock.removeAllListeners).toHaveBeenCalledTimes(1);
      expect(webSocketMock.removeAllListeners).toHaveBeenCalledTimes(1);
      expect(extensionConnectionMock.removeAllListeners).toHaveBeenCalledTimes(
        1,
      );
    });

    it('disconnects extension connection', async () => {
      expect(extensionConnectionMock.disconnect).toHaveBeenCalledTimes(1);
    });

    it('destroys stream', async () => {
      expect(webSocketStreamMock.destroy).toHaveBeenCalledTimes(1);
    });

    it('closes web socket', async () => {
      expect(webSocketMock.close).toHaveBeenCalledTimes(1);
    });

    it('clears current connection', async () => {
      expect(DesktopApp.getConnection()).toBeUndefined();
    });

    it('emits restart event', async () => {
      expect(restartEventListener).toHaveBeenCalledTimes(1);
    });
  });
});

import { app, BrowserWindow, ipcMain } from 'electron';
import { Server as WebSocketServer } from 'ws';
import { WebSocketStream } from '@metamask/desktop/dist/web-socket-stream';
import * as RawStateUtils from '@metamask/desktop/dist/utils/state';
import EncryptedWebSocketStream from '@metamask/desktop/dist/encryption/web-socket-stream';
import {
  PORT_MOCK,
  createWebSocketNodeMock,
  createWebSocketServerMock,
  createWebSocketStreamMock,
  createEventEmitterMock,
  createExtensionConnectionMock,
} from '../../test/mocks';
import { simulateNodeEvent } from '../../test/utils';
import cfg from './utils/config';
import ExtensionConnection from './extension-connection';
import { updateCheck } from './update-check';
import DesktopApp from './desktop-app';

jest.mock('extension-port-stream');
jest.mock('@metamask/desktop/dist/encryption/web-socket-stream');
jest.mock('./extension-connection');
jest.mock('./ui/app-navigation');
jest.mock('./ui/app-events');
jest.mock('./ui/window-service');
jest.mock('./ui/ui-state');
jest.mock('./metrics/analytics');
jest.mock('./storage/ui-storage', () => ({
  setUiStorage: jest.fn(),
}));
jest.mock('./metrics/metrics-service', () => jest.fn(), { virtual: true });

jest.mock('@metamask/desktop/dist/utils/state', () => ({
  getDesktopState: jest.fn(),
  clearRawState: jest.fn(),
}));

jest.mock('@metamask/desktop/dist/web-socket-stream', () => ({
  WebSocketStream: jest.fn(),
}));

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

describe('Desktop', () => {
  const browserWindowConstructorMock = BrowserWindow as any;
  const webSocketServerConstructorMock = WebSocketServer as any;
  const webSocketMock = createWebSocketNodeMock();
  const webSocketStreamMock = createWebSocketStreamMock();
  const webSocketServerMock = createWebSocketServerMock();
  const appMock = app as any;
  const extensionConnectionMock = createExtensionConnectionMock();
  const pairingMock = createEventEmitterMock();
  const rawStateUtilsMock = RawStateUtils as jest.Mocked<typeof RawStateUtils>;
  const IPCMainMock = ipcMain as jest.Mocked<any>;

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

    rawStateUtilsMock.getDesktopState.mockResolvedValue({
      desktopEnabled: false,
    });
  });

  describe('init', () => {
    it('creates web socket server', async () => {
      cfg().webSocket.port = PORT_MOCK;

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
      cfg().webSocket.disableEncryption = true;

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
    let restartEventListener: jest.Mock;

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

  describe('should handle ipcMain', () => {
    it('reset event', async () => {
      const restartEventListener = jest.fn();
      DesktopApp.on('restart', restartEventListener);

      IPCMainMock.handle.mockImplementation(
        (eventName: string, callback: any) => {
          if (eventName === 'reset') {
            callback();
          }
        },
      );

      await DesktopApp.init();

      expect(restartEventListener).toHaveBeenCalledTimes(1);
      expect(rawStateUtilsMock.clearRawState).toHaveBeenCalledTimes(1);
    });
  });
});

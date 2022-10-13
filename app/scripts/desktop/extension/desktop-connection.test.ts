import { Duplex, PassThrough } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import PortStream from 'extension-port-stream';
import { v4 as uuidv4 } from 'uuid';
import {
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
  MESSAGE_ACKNOWLEDGE,
} from '../../../../shared/constants/desktop';
import {
  REMOTE_PORT_NAME_MOCK,
  REMOTE_PORT_SENDER_MOCK,
  DATA_MOCK,
  createStreamMock,
  createRemotePortMock,
  createMultiplexMock,
  JSON_RPC_ID_MOCK,
  STREAM_MOCK,
  UUID_MOCK,
  createExtensionVersionCheckMock,
} from '../test/mocks';
import {
  simulateStreamMessage,
  simulateNodeEvent,
  flushPromises,
} from '../test/utils';
import { browser } from '../browser/browser-polyfill';
import { ConnectionType } from '../types/background';
import { ClientId } from '../types/desktop';
import { ExtensionVersionCheck } from '../shared/version-check';
import * as RawState from '../utils/raw-state';
import DesktopConnection from './desktop-connection';

jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream');
jest.mock('uuid');
jest.mock('../utils/raw-state');
jest.mock('../../../../shared/modules/totp');

jest.mock(
  '../shared/version-check',
  () => ({ ExtensionVersionCheck: jest.fn() }),
  { virtual: true },
);

jest.mock('stream', () => ({ Duplex: jest.fn(), PassThrough: jest.fn() }), {
  virtual: true,
});

jest.mock(
  '../browser/browser-polyfill',
  () => ({
    browser: {
      runtime: { reload: jest.fn() },
    },
  }),
  {
    virtual: true,
  },
);

describe('Desktop Connection', () => {
  const streamMock = createStreamMock();
  const multiplexMock = createMultiplexMock();
  const portStreamMock = createStreamMock();
  const remotePortMock = createRemotePortMock();
  const browserMock = browser as any;
  const passThroughMock = createStreamMock();
  const uuidMock = uuidv4 as jest.MockedFunction<typeof uuidv4>;
  const versionCheckMock = createExtensionVersionCheckMock();
  const rawStateMock = RawState as jest.Mocked<typeof RawState>;

  const objectMultiplexConstructorMock = ObjectMultiplex as jest.MockedClass<
    typeof ObjectMultiplex
  >;

  const portStreamConstructorMock = PortStream as jest.MockedClass<
    typeof PortStream
  >;

  const passThroughConstructorMock = PassThrough as jest.MockedClass<
    typeof PassThrough
  >;

  const versionCheckConstructorMock = ExtensionVersionCheck as jest.MockedClass<
    typeof ExtensionVersionCheck
  >;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktopConnection: DesktopConnection;

  const simulateTranferStateReceipt = async (promise: Promise<any>) => {
    await flushPromises();

    await simulateStreamMessage(
      multiplexStreamMocks[CLIENT_ID_STATE],
      MESSAGE_ACKNOWLEDGE,
    );

    await promise;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    streamMock.pipe.mockReturnValue(multiplexMock);
    portStreamMock.pipe.mockImplementation((dest) => dest);
    passThroughMock.pipe.mockImplementation((dest) => dest);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    portStreamConstructorMock.mockReturnValue(portStreamMock as any);
    passThroughConstructorMock.mockReturnValue(passThroughMock as any);
    versionCheckConstructorMock.mockReturnValue(versionCheckMock as any);
    uuidMock.mockReturnValue(UUID_MOCK);

    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

    desktopConnection = new DesktopConnection(streamMock);
  });

  describe.each([
    { connectionType: ConnectionType.INTERNAL, name: `Internal` },
    { connectionType: ConnectionType.EXTERNAL, name: `External` },
  ])('createStream - $name Connection', ({ connectionType }) => {
    it('pipes remote port to new multiplex client stream', async () => {
      desktopConnection.createStream(
        remotePortMock,
        connectionType,
        portStreamMock,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledTimes(8);
      expect(multiplexMock.createStream).toHaveBeenLastCalledWith(UUID_MOCK);

      const clientStreamMock = multiplexStreamMocks[UUID_MOCK];

      expect(portStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(portStreamMock.pipe).toHaveBeenCalledWith(passThroughMock);

      expect(passThroughMock.pipe).toHaveBeenCalledTimes(1);
      expect(passThroughMock.pipe).toHaveBeenCalledWith(clientStreamMock);

      expect(clientStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(clientStreamMock.pipe).toHaveBeenCalledWith(portStreamMock);
    });

    it('sends new connection message', async () => {
      desktopConnection.createStream(
        remotePortMock,
        connectionType,
        portStreamMock,
      );

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
  });

  describe('transferState', () => {
    it('writes state to state stream', async () => {
      rawStateMock.getAndUpdateDesktopState.mockResolvedValueOnce(DATA_MOCK);

      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        portStreamMock,
      );

      const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
      const promise = desktopConnection.transferState();

      await simulateTranferStateReceipt(promise);

      expect(stateStreamMock.write).toHaveBeenCalledTimes(1);
      expect(stateStreamMock.write).toHaveBeenCalledWith(DATA_MOCK);
    });
  });

  describe('checkVersion', () => {
    it('invokes version check instance', async () => {
      await desktopConnection.checkVersions();
      expect(versionCheckMock.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('on port stream disconnect', () => {
    it('sends end connection message', async () => {
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        portStreamMock,
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
    const simulateDisableMessage = async (data: any) => {
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        portStreamMock,
      );

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];
      await simulateStreamMessage(disableStreamMock, data);
    };

    it('updates state if message contains state', async () => {
      await simulateDisableMessage(DATA_MOCK);

      expect(rawStateMock.set).toHaveBeenCalledTimes(1);
      expect(rawStateMock.set).toHaveBeenCalledWith(DATA_MOCK);
    });

    it('sets desktop enabled to false if no state in message', async () => {
      await simulateDisableMessage(undefined);

      expect(rawStateMock.setDesktopState).toHaveBeenCalledTimes(1);
      expect(rawStateMock.setDesktopState).toHaveBeenCalledWith({
        desktopEnabled: false,
      });
    });

    it.each([
      ['message contains state', DATA_MOCK],
      ['no state in message', undefined],
    ])('restarts extension if %s', async (_, data) => {
      await simulateDisableMessage(data);
      expect(browserMock.runtime.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('on state message', () => {
    beforeEach(async () => {
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        portStreamMock,
      );

      const stateStreaMock = multiplexStreamMocks[CLIENT_ID_STATE];
      await simulateStreamMessage(stateStreaMock, DATA_MOCK);
    });

    it('updates state', async () => {
      expect(rawStateMock.set).toHaveBeenCalledTimes(1);
      expect(rawStateMock.set).toHaveBeenCalledWith(DATA_MOCK);
    });
  });

  describe('on port stream message', () => {
    const simulatePortStreamMessage = async (message: any) => {
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        portStreamMock,
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

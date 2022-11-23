import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import { browser } from '@metamask/desktop/dist/browser';
import {
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  CLIENT_ID_DISABLE,
  MESSAGE_ACKNOWLEDGE,
} from '@metamask/desktop/dist/constants';
import {
  ConnectionType,
  ClientId,
  PairingKeyStatus,
} from '@metamask/desktop/dist/types';
import * as RawStateUtils from '@metamask/desktop/dist/utils/state';
import { VersionCheck } from '@metamask/desktop/dist/version-check';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import {
  REMOTE_PORT_NAME_MOCK,
  REMOTE_PORT_SENDER_MOCK,
  DATA_MOCK,
  createStreamMock,
  createRemotePortMock,
  createMultiplexMock,
  UUID_MOCK,
  createExtensionVersionCheckMock,
  createExtensionPairingMock,
  DATA_2_MOCK,
} from '../../test/mocks';
import {
  simulateStreamMessage,
  simulateNodeEvent,
  flushPromises,
} from '../../test/utils';
import { ExtensionPairing } from '../shared/pairing';
import DesktopConnection from './desktop-connection';

jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('extension-port-stream');
jest.mock('uuid');
jest.mock('@metamask/desktop/dist/utils/totp');

jest.mock(
  '../../submodules/extension/app/scripts/platforms/extension',
  () => ({}),
  { virtual: true },
);

jest.mock('@metamask/desktop/dist/browser', () => {
  const original = jest.requireActual('@metamask/desktop/dist/browser');
  return {
    ...original,
    browser: {
      runtime: { reload: jest.fn() },
    },
  };
});

jest.mock('@metamask/desktop/dist/utils/state', () => ({
  addPairingKeyToRawState: jest.fn(),
  getAndUpdateDesktopState: jest.fn(),
  removePairingKeyFromRawState: jest.fn(),
  setRawState: jest.fn(),
  setDesktopState: jest.fn(),
}));

jest.mock(
  '@metamask/desktop/dist/utils/utils',
  () => {
    const original = jest.requireActual('@metamask/desktop/dist/utils/utils');
    return {
      uuid: jest.fn(),
      timeoutPromise: original.timeoutPromise,
      flattenMessage: original.flattenMessage,
    };
  },
  { virtual: true },
);

jest.mock(
  '@metamask/desktop/dist/version-check',
  () => ({ VersionCheck: jest.fn() }),
  {
    virtual: true,
  },
);

jest.mock(
  '../shared/pairing',
  () => ({ ExtensionPairing: jest.fn(), DesktopPairing: jest.fn() }),
  { virtual: true },
);

jest.mock('stream', () => ({ Duplex: jest.fn(), PassThrough: jest.fn() }), {
  virtual: true,
});

describe('Desktop Connection', () => {
  const streamMock = createStreamMock();
  const multiplexMock = createMultiplexMock();
  const uiStreamMock = createStreamMock();
  const remotePortMock = createRemotePortMock();
  const browserMock = browser as any;
  const uuidMock = uuid as jest.MockedFunction<typeof uuid>;
  const versionCheckMock = createExtensionVersionCheckMock();
  const extensionPairingMock = createExtensionPairingMock();
  const rawStateMock = RawStateUtils as jest.Mocked<typeof RawStateUtils>;

  const objectMultiplexConstructorMock = ObjectMultiplex as jest.MockedClass<
    typeof ObjectMultiplex
  >;

  const versionCheckConstructorMock = VersionCheck as jest.MockedClass<
    typeof VersionCheck
  >;

  const extensionPairingConstructorMock = ExtensionPairing as jest.MockedClass<
    typeof ExtensionPairing
  >;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let desktopConnection: DesktopConnection;

  const simulateTransferStateReceipt = async (promise: Promise<any>) => {
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
    uiStreamMock.pipe.mockImplementation((dest) => dest);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    versionCheckConstructorMock.mockReturnValue(versionCheckMock as any);
    extensionPairingConstructorMock.mockReturnValue(extensionPairingMock);
    uuidMock.mockReturnValue(UUID_MOCK);
    extensionPairingMock.init.mockReturnValue(extensionPairingMock);

    rawStateMock.addPairingKeyToRawState.mockImplementation((data) =>
      Promise.resolve(data),
    );

    multiplexMock.createStream.mockImplementation((name: any) => {
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
        uiStreamMock,
      );
      expect(multiplexMock.createStream).toHaveBeenCalledTimes(8);
      expect(multiplexMock.createStream).toHaveBeenLastCalledWith(UUID_MOCK);

      const clientStreamMock = multiplexStreamMocks[UUID_MOCK];

      expect(uiStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(uiStreamMock.pipe).toHaveBeenCalledWith(clientStreamMock);

      expect(clientStreamMock.pipe).toHaveBeenCalledTimes(1);
      expect(clientStreamMock.pipe).toHaveBeenCalledWith(uiStreamMock);
    });

    it('sends new connection message', async () => {
      desktopConnection.createStream(
        remotePortMock,
        connectionType,
        uiStreamMock,
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
      rawStateMock.getAndUpdateDesktopState.mockResolvedValueOnce(
        DATA_MOCK as any,
      );

      rawStateMock.removePairingKeyFromRawState.mockReturnValueOnce(
        DATA_2_MOCK as any,
      );

      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        uiStreamMock,
      );

      const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
      const promise = desktopConnection.transferState();

      await simulateTransferStateReceipt(promise);

      expect(stateStreamMock.write).toHaveBeenCalledTimes(1);
      expect(stateStreamMock.write).toHaveBeenCalledWith(DATA_2_MOCK);
    });
  });

  describe('checkVersion', () => {
    it('invokes version check instance', async () => {
      await desktopConnection.checkVersions();
      expect(versionCheckMock.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkPairingKey', () => {
    it('invokes pairing key check instance', async () => {
      extensionPairingMock.checkPairingKeyMatch.mockImplementation(
        async () => PairingKeyStatus.pairingKeyMatch,
      );
      expect(await desktopConnection.checkPairingKey()).toBe(
        PairingKeyStatus.pairingKeyMatch,
      );
      expect(extensionPairingMock.checkPairingKeyMatch).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('on UI stream end', () => {
    it('sends end connection message', async () => {
      await desktopConnection.createStream(
        remotePortMock,
        ConnectionType.INTERNAL,
        uiStreamMock,
      );

      await simulateNodeEvent(uiStreamMock, 'finish');

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
        uiStreamMock,
      );

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];
      await simulateStreamMessage(disableStreamMock, data);
    };

    it('updates state if message contains state', async () => {
      await simulateDisableMessage(DATA_MOCK);

      expect(rawStateMock.setRawState).toHaveBeenCalledTimes(1);
      expect(rawStateMock.setRawState).toHaveBeenCalledWith(DATA_MOCK);
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
        uiStreamMock,
      );

      const stateStreaMock = multiplexStreamMocks[CLIENT_ID_STATE];
      await simulateStreamMessage(stateStreaMock, DATA_MOCK);
    });

    it('updates state', async () => {
      expect(rawStateMock.setRawState).toHaveBeenCalledTimes(1);
      expect(rawStateMock.setRawState).toHaveBeenCalledWith(DATA_MOCK);
    });
  });
});

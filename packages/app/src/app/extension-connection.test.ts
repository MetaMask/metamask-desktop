import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import {
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_DISABLE,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
  MESSAGE_ACKNOWLEDGE,
} from '@metamask/desktop/dist/constants';
import { ClientId, ConnectionType } from '@metamask/desktop/dist/types';
import * as RawStateUtils from '@metamask/desktop/dist/utils/state';
import {
  CLIENT_ID_MOCK,
  NEW_CONNECTION_MESSAGE_MOCK,
  DATA_MOCK,
  createStreamMock,
  createMultiplexMock,
  CLIENT_ID_2_MOCK,
  createDesktopPairingMock,
  DATA_2_MOCK,
} from '../../test/mocks';
import {
  simulateStreamMessage,
  expectEventToFire,
  flushPromises,
} from '../../test/utils';
import { unregisterRequestStream } from './browser/node-browser';
import { DesktopPairing } from './pairing';
import ExtensionConnection from './extension-connection';

jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });
jest.mock('./pairing');

jest.mock('@metamask/desktop/dist/utils/state', () => ({
  addPairingKeyToRawState: jest.fn(),
  clearRawState: jest.fn(),
  getAndUpdateDesktopState: jest.fn(),
  removePairingKeyFromRawState: jest.fn(),
  setRawState: jest.fn(),
}));

jest.mock(
  './browser/node-browser',
  () => ({
    registerRequestStream: jest.fn(),
    unregisterRequestStream: jest.fn(),
  }),
  {
    virtual: true,
  },
);

describe('Extension Connection', () => {
  const streamMock = createStreamMock();
  const multiplexMock = createMultiplexMock();
  const objectMultiplexConstructorMock = ObjectMultiplex as jest.MockedClass<
    typeof ObjectMultiplex
  >;
  const desktopPairingMock = createDesktopPairingMock();
  const rawStateUtilsMock = RawStateUtils as jest.Mocked<typeof RawStateUtils>;

  const DesktopPairingConstructorMock = DesktopPairing as jest.MockedClass<
    typeof DesktopPairing
  >;

  const unregisterRequestStreamMock =
    unregisterRequestStream as jest.MockedFunction<
      typeof unregisterRequestStream
    >;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let extensionConnection: ExtensionConnection;

  beforeEach(() => {
    jest.resetAllMocks();

    multiplexMock.createStream.mockImplementation((name: any) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

    streamMock.pipe.mockReturnValue(multiplexMock as any);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);
    DesktopPairingConstructorMock.mockReturnValue(desktopPairingMock);
    desktopPairingMock.init.mockReturnValue(desktopPairingMock);

    rawStateUtilsMock.addPairingKeyToRawState.mockImplementation((data) =>
      Promise.resolve(data),
    );

    extensionConnection = new ExtensionConnection(streamMock);
  });

  describe('getPairing', () => {
    it('returns instance', () => {
      expect(extensionConnection.getPairing()).toBe(desktopPairingMock);
    });
  });

  describe('disconnect', () => {
    it('unregisters browser request stream', () => {
      extensionConnection.disconnect();
      expect(unregisterRequestStreamMock).toHaveBeenCalledTimes(1);
    });

    it('ends all client streams', async () => {
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

      const clientStream1Mock = multiplexStreamMocks[CLIENT_ID_MOCK];
      const clientStream2Mock = multiplexStreamMocks[CLIENT_ID_2_MOCK];

      extensionConnection.disconnect();

      expect(clientStream1Mock.end).toHaveBeenCalledTimes(1);
      expect(clientStream2Mock.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('transferState', () => {
    let stateStreamMock: jest.Mocked<Duplex>;

    beforeEach(async () => {
      stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
    });

    const transferState = async (
      state: any,
      { afterExtensionState }: { afterExtensionState: boolean },
    ) => {
      if (afterExtensionState) {
        await simulateStreamMessage(stateStreamMock, DATA_MOCK);
      }

      await extensionConnection.transferState(state);
    };

    it('writes state to state stream if extension state already received', async () => {
      rawStateUtilsMock.removePairingKeyFromRawState.mockReturnValueOnce(
        DATA_2_MOCK as any,
      );

      await transferState(DATA_MOCK, {
        afterExtensionState: true,
      });

      expect(stateStreamMock.write).toHaveBeenCalledTimes(2);
      expect(stateStreamMock.write).toHaveBeenCalledWith(DATA_2_MOCK);
    });

    it('does nothing if extension state not yet received', async () => {
      await transferState(DATA_MOCK, {
        afterExtensionState: false,
      });

      expect(stateStreamMock.write).toHaveBeenCalledTimes(0);
    });
  });

  describe('disable', () => {
    const disable = async ({
      afterExtensionState,
    }: {
      afterExtensionState: boolean;
    }) => {
      rawStateUtilsMock.getAndUpdateDesktopState.mockResolvedValue({
        ...DATA_MOCK,
        data: { DesktopController: { desktopEnabled: false } },
      });

      if (afterExtensionState) {
        const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
        await simulateStreamMessage(stateStreamMock, DATA_MOCK);
      }

      const promise = extensionConnection.disable();
      await flushPromises();
      await simulateStreamMessage(
        multiplexStreamMocks[CLIENT_ID_DISABLE],
        MESSAGE_ACKNOWLEDGE,
      );
      await promise;
    };

    it('writes state to disable stream if extension state already received', async () => {
      await disable({ afterExtensionState: true });

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(1);
      expect(disableStreamMock.write).toHaveBeenCalledWith({
        ...DATA_MOCK,
        data: {
          DesktopController: { desktopEnabled: false },
        },
      });
    });

    it('writes empty message to disable stream if extension state not yet received', async () => {
      await disable({ afterExtensionState: false });

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(1);
      expect(disableStreamMock.write).toHaveBeenCalledWith(undefined);
    });

    it.each([
      ['already', true],
      ['not yet', false],
    ])(
      'clears state if extension state %s received',
      async (_, isExtensionStateReceived) => {
        await disable({ afterExtensionState: isExtensionStateReceived });
        expect(rawStateUtilsMock.clearRawState).toHaveBeenCalledTimes(1);
      },
    );
  });

  describe('on new connection message', () => {
    it.each([
      {
        event: 'connect-remote',
        connectionType: ConnectionType.INTERNAL,
      },
      {
        event: 'connect-external',
        connectionType: ConnectionType.EXTERNAL,
      },
    ])(
      'fires $event event containing new multiplex stream',
      async ({ event, connectionType }) => {
        const eventListener = jest.fn();

        extensionConnection.once(event, eventListener);

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

        expect(eventListener).toHaveBeenCalledTimes(1);
        expect(eventListener).toHaveBeenCalledWith({
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
    const simulateExtensionState = async () => {
      const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
      await simulateStreamMessage(stateStreamMock, DATA_MOCK);
    };

    it('updates state', async () => {
      await simulateExtensionState();

      expect(rawStateUtilsMock.setRawState).toHaveBeenCalledTimes(1);
      expect(rawStateUtilsMock.setRawState).toHaveBeenCalledWith(DATA_MOCK);
    });

    // eslint-disable-next-line jest/expect-expect
    it('fires restart event', async () => {
      await expectEventToFire(
        extensionConnection,
        'restart',
        undefined,
        async () => {
          await simulateExtensionState();
        },
      );
    });

    // eslint-disable-next-line jest/expect-expect
    it('fires paired event', async () => {
      await expectEventToFire(
        extensionConnection,
        'paired',
        undefined,
        async () => {
          await simulateExtensionState();
        },
      );
    });
  });
});

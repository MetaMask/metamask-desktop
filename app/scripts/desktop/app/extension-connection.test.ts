import { Duplex } from 'stream';
import ObjectMultiplex from 'obj-multiplex';
import {
  CLIENT_ID_END_CONNECTION,
  CLIENT_ID_DISABLE,
  CLIENT_ID_NEW_CONNECTION,
  CLIENT_ID_STATE,
} from '../../../../shared/constants/desktop';
import {
  CLIENT_ID_MOCK,
  NEW_CONNECTION_MESSAGE_MOCK,
  DATA_MOCK,
  createStreamMock,
  createMultiplexMock,
} from '../test/mocks';
import {
  simulateStreamMessage,
  expectEventToFire,
  flushPromises,
} from '../test/utils';
import { browser } from '../browser/browser-polyfill';
import { ClientId } from '../types/desktop';
import { ConnectionType } from '../types/background';
import ExtensionConnection from './extension-connection';

jest.mock('obj-multiplex', () => jest.fn(), { virtual: true });

jest.mock(
  '../browser/browser-polyfill',
  () => ({
    browser: { storage: { local: { get: jest.fn(), set: jest.fn() } } },
  }),
  {
    virtual: true,
  },
);

describe('Extension Connection', () => {
  const streamMock = createStreamMock();
  const multiplexMock = createMultiplexMock();
  const objectMultiplexConstructorMock = ObjectMultiplex;
  const browserMock = browser as any;

  const multiplexStreamMocks: { [clientId: ClientId]: jest.Mocked<Duplex> } =
    {};

  let extensionConnection: ExtensionConnection;

  beforeEach(() => {
    jest.resetAllMocks();

    multiplexMock.createStream.mockImplementation((name) => {
      const newStream = createStreamMock();
      multiplexStreamMocks[name] = newStream;
      return newStream as any;
    });

    streamMock.pipe.mockReturnValue(multiplexMock as any);
    objectMultiplexConstructorMock.mockReturnValue(multiplexMock);

    extensionConnection = new ExtensionConnection(streamMock);
  });

  describe('disconnect', () => {
    it('destroys multiplex', async () => {
      extensionConnection.disconnect();
      expect(multiplexMock.destroy).toHaveBeenCalledTimes(1);
    });
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

      expect(browserMock.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith(DATA_MOCK);
    });

    // eslint-disable-next-line jest/expect-expect
    it('fires extension-state event', async () => {
      await expectEventToFire(
        extensionConnection,
        'extension-state',
        undefined,
        async () => {
          await simulateExtensionState();
        },
      );
    });
  });

  describe('disable', () => {
    const disable = async ({
      afterExtensionState,
    }: {
      afterExtensionState: boolean;
    }) => {
      browserMock.storage.local.get.mockResolvedValue({
        ...DATA_MOCK,
        data: { DesktopController: { desktopEnabled: true } },
      });

      browserMock.storage.local.set.mockResolvedValue();

      if (afterExtensionState) {
        const stateStreamMock = multiplexStreamMocks[CLIENT_ID_STATE];
        await simulateStreamMessage(stateStreamMock, DATA_MOCK);
      }

      const promise = extensionConnection.disable();
      await flushPromises();
      await simulateStreamMessage(multiplexStreamMocks[CLIENT_ID_DISABLE], {});
      await promise;
    };

    it('writes state to disable stream if desktop disabled', async () => {
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

    it('does nothing if desktop state has not yet been initiated with the extension state', async () => {
      await disable({ afterExtensionState: false });

      const disableStreamMock = multiplexStreamMocks[CLIENT_ID_DISABLE];

      expect(disableStreamMock.write).toHaveBeenCalledTimes(0);
    });
  });

  describe('transferState', () => {
    let stateStreamMock;

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

    it('writes state to state stream if extension state received', async () => {
      await transferState(DATA_MOCK, {
        afterExtensionState: true,
      });

      expect(stateStreamMock.write).toHaveBeenCalledTimes(2);
      expect(stateStreamMock.write).toHaveBeenCalledWith(DATA_MOCK);
    });

    it('does nothing if extension state not received', async () => {
      await transferState(DATA_MOCK, {
        afterExtensionState: false,
      });

      expect(stateStreamMock.write).toHaveBeenCalledTimes(0);
    });
  });
});

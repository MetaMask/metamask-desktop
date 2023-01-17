import log from 'loglevel';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import {
  ARGS_MOCK,
  createStreamMock,
  UUID_MOCK,
  VALUE_2_MOCK,
  VERSION_MOCK,
} from '../../test/mocks';
import { simulateNodeEvent } from '../../test/utils';
import { browser, registerRequestStream } from './node-browser';

jest.mock('loglevel');
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

describe('Node Browser', () => {
  const browserMock = browser as any;
  const streamMock = createStreamMock();
  const uuidMock = uuid as jest.MockedFunction<typeof uuid>;

  beforeEach(() => {
    jest.resetAllMocks();
    uuidMock.mockReturnValue(UUID_MOCK);
  });

  describe('get', () => {
    it('returns manually defined property', () => {
      expect(browserMock.runtime.id).toBe('1234');
    });
  });

  describe('call', () => {
    it('invokes manually defined function', () => {
      process.env.PACKAGE_VERSION = VERSION_MOCK;
      expect(browserMock.runtime.getManifest().manifest_version).toBe(2);
    });

    it('logs message if function unhandled', () => {
      browserMock.runtime.getBrowserInfo();

      expect(log.debug).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledWith(
        `Browser method not supported - runtime.getBrowserInfo`,
      );
    });

    describe('if function proxied', () => {
      it('writes request to stream', () => {
        registerRequestStream(streamMock);

        browserMock.browserAction.setBadgeText(...ARGS_MOCK);

        expect(streamMock.write).toHaveBeenCalledTimes(1);
        expect(streamMock.write).toHaveBeenCalledWith({
          id: UUID_MOCK,
          key: ['browserAction', 'setBadgeText'],
          args: ARGS_MOCK,
        });
      });

      it('returns result from stream message', async () => {
        registerRequestStream(streamMock);

        const promise = browserMock.browserAction.setBadgeText(...ARGS_MOCK);

        await simulateNodeEvent(streamMock, 'data', {
          id: UUID_MOCK,
          result: VALUE_2_MOCK,
        });

        const result = await promise;

        expect(result).toStrictEqual(VALUE_2_MOCK);
      });

      it('logs error if timeout waiting for stream message with result', async () => {
        registerRequestStream(streamMock);

        jest.useFakeTimers();

        const promise = browserMock.browserAction.setBadgeText(...ARGS_MOCK);

        jest.runAllTimers();
        jest.useRealTimers();

        await promise;

        expect(log.debug).toHaveBeenLastCalledWith(
          'Timeout waiting for browser response - browserAction.setBadgeText',
        );
      });
    });
  });
});

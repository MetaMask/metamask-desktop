import log from 'loglevel';
import { ARGS_MOCK, createStreamMock, VALUE_2_MOCK } from '../test/mocks';
import { simulateNodeEvent } from '../test/utils';
import { browser, registerRequestStream } from './node-browser';

jest.mock('loglevel');

describe('Node Browser', () => {
  const browserMock = browser as any;
  const streamMock = createStreamMock();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('returns existing property', () => {
      expect(browserMock.runtime.id).toStrictEqual('1234');
    });
  });

  describe('call', () => {
    it('returns value from existing function', () => {
      expect(browserMock.runtime.getManifest().manifest_version).toStrictEqual(
        2,
      );
    });

    it('logs message if function missing and not in proxy whitelist', () => {
      browserMock.test1.test2();

      expect(log.debug).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledWith(
        `Browser method not supported - test1.test2`,
      );
    });

    describe('if function missing and in proxy whitelist', () => {
      it('writes request to stream', () => {
        registerRequestStream(streamMock);

        browserMock.browserAction.setBadgeText(...ARGS_MOCK);

        expect(streamMock.write).toHaveBeenCalledTimes(1);
        expect(streamMock.write).toHaveBeenCalledWith({
          id: 1,
          key: ['browserAction', 'setBadgeText'],
          args: ARGS_MOCK,
        });
      });

      it('returns result from stream message', async () => {
        registerRequestStream(streamMock);

        const promise = browserMock.browserAction.setBadgeText(...ARGS_MOCK);

        await simulateNodeEvent(streamMock, 'data', {
          id: 2,
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

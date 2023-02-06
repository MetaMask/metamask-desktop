import log from '../utils/log';
import { BrowserProxyRequest } from '../types';
import {
  ARGS_MOCK,
  createStreamMock,
  UUID_MOCK,
  VALUE_MOCK,
} from '../../test/mocks';
import { simulateStreamMessage } from '../../test/utils';
import { registerResponseStream } from './browser-proxy';
import { browser } from '.';

jest.mock('loglevel');

jest.mock('.', () => ({
  browser: {
    browserAction: {
      setBadgeText: jest.fn(),
    },
  },
}));

describe('Browser Proxy', () => {
  const browserMock = browser as any;
  const streamMock = createStreamMock();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('on stream message', () => {
    it('runs method against browser and writes result to stream', async () => {
      registerResponseStream(streamMock);

      const requestMessageMock: BrowserProxyRequest = {
        id: UUID_MOCK,
        key: ['browserAction', 'setBadgeText'],
        args: ARGS_MOCK,
      };

      browserMock.browserAction.setBadgeText.mockReturnValueOnce(VALUE_MOCK);

      await simulateStreamMessage(streamMock, requestMessageMock);

      expect(browserMock.browserAction.setBadgeText).toHaveBeenCalledTimes(1);
      expect(browserMock.browserAction.setBadgeText).toHaveBeenCalledWith(
        ...ARGS_MOCK,
      );

      expect(streamMock.write).toHaveBeenCalledTimes(1);
      expect(streamMock.write).toHaveBeenCalledWith({
        id: UUID_MOCK,
        result: VALUE_MOCK,
      });
    });

    it('does nothing if browser method does not exist', async () => {
      registerResponseStream(streamMock);

      const requestMessageMock: BrowserProxyRequest = {
        id: UUID_MOCK,
        key: ['browserAction', 'testMethod'],
        args: ARGS_MOCK,
      };

      await simulateStreamMessage(streamMock, requestMessageMock);

      expect(streamMock.write).toHaveBeenCalledTimes(0);
      expect(log.error).toHaveBeenLastCalledWith(
        'Cannot find browser method - browserAction.testMethod',
      );
    });
  });
});

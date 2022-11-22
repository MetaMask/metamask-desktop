import {
  createStreamMock,
  DATA_2_MOCK,
  DATA_MOCK,
  PROPERTY_2_MOCK,
  VALUE_2_MOCK,
} from '../../test/mocks';
import { simulateStreamMessage } from '../../test/utils';
import { waitForMessage } from './stream';

describe('Stream Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('waitForMessage', () => {
    it('returns stream message once filter matched', async () => {
      const streamMock = createStreamMock();

      const promise = waitForMessage(streamMock, (data: any) =>
        Promise.resolve(data[PROPERTY_2_MOCK] === VALUE_2_MOCK),
      );

      await simulateStreamMessage(streamMock, DATA_MOCK);
      await simulateStreamMessage(streamMock, DATA_2_MOCK);

      const result = await promise;

      expect(result).toStrictEqual(DATA_2_MOCK);
    });
  });
});

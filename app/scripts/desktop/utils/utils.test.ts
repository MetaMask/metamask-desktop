import {
  DATA_MOCK,
  METHOD_MOCK,
  RESULT_MOCK,
  STREAM_MOCK,
  TYPE_MOCK,
} from '../test/mocks';
import { flattenMessage } from './utils';

describe('Desktop Utils', () => {
  describe('flattenMessage', () => {
    it('returns only stream', () => {
      const rawMessage = { ...DATA_MOCK, name: STREAM_MOCK };
      const result = flattenMessage(rawMessage);
      expect(result).toStrictEqual({ stream: STREAM_MOCK });
    });

    it('returns only type', async function () {
      const rawMessage = { ...DATA_MOCK, data: { name: TYPE_MOCK } };
      const result = flattenMessage(rawMessage);
      expect(result).toStrictEqual({ type: TYPE_MOCK });
    });

    it('returns only method', () => {
      const rawMessage = {
        ...DATA_MOCK,
        data: { data: { method: METHOD_MOCK } },
      };
      const result = flattenMessage(rawMessage);
      expect(result).toStrictEqual({ method: METHOD_MOCK });
    });

    it('returns only isResult', () => {
      const rawMessage = {
        ...DATA_MOCK,
        data: { data: { result: RESULT_MOCK } },
      };
      const result = flattenMessage(rawMessage);
      expect(result).toStrictEqual({ isResult: true });
    });

    it('returns all relevant data', () => {
      const rawMessage = {
        ...DATA_MOCK,
        name: STREAM_MOCK,
        data: {
          name: TYPE_MOCK,
          data: { method: METHOD_MOCK, result: RESULT_MOCK },
        },
      };
      const result = flattenMessage(rawMessage);
      expect(result).toStrictEqual({
        stream: STREAM_MOCK,
        type: TYPE_MOCK,
        method: METHOD_MOCK,
        isResult: true,
      });
    });
  });
});

import { EventEmitter } from 'stream';
import { DATA_2_MOCK, DATA_MOCK } from '../test/mocks';
import { expectEventToFire } from '../test/utils';
import { forwardEvents } from './events';

describe('Events Utils', () => {
  describe('forwardEvents', () => {
    // eslint-disable-next-line jest/expect-expect
    it('emits same event on target once emitted by source', async () => {
      const source = new EventEmitter();
      const target = new EventEmitter();

      forwardEvents(source, target, ['test1', 'test2']);

      await expectEventToFire(target, 'test1', DATA_MOCK, async () => {
        source.emit('test1', DATA_MOCK);
      });

      await expectEventToFire(target, 'test2', DATA_2_MOCK, async () => {
        source.emit('test2', DATA_2_MOCK);
      });
    });
  });
});

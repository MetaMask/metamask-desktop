import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
import PersonalMessageManager from './personal-message-manager';

describe('Personal Message Manager', () => {
  let messageManager;

  beforeEach(() => {
    messageManager = new PersonalMessageManager({
      metricsEvent: jest.fn(),
    });
  });

  describe('#getMsgList', () => {
    it('when new should return empty array', () => {
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('#addMsg', () => {
    it('adds a Msg returned in getMsgList', () => {
      const Msg = {
        id: 1,
        status: TRANSACTION_STATUSES.APPROVED,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toStrictEqual(1);
    });
  });

  describe('#setMsgStatusApproved', () => {
    it('sets the Msg status to approved', () => {
      const Msg = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      messageManager.setMsgStatusApproved(1);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].status).toStrictEqual(TRANSACTION_STATUSES.APPROVED);
    });
  });

  describe('#rejectMsg', () => {
    it('sets the Msg status to rejected', () => {
      const Msg = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: 'unit test',
      };
      messageManager.addMsg(Msg);
      messageManager.rejectMsg(1);
      const result = messageManager.messages;
      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toHaveLength(1);
      expect(result[0].status).toStrictEqual(TRANSACTION_STATUSES.REJECTED);
    });
  });

  describe('#_updateMsg', () => {
    it('replaces the Msg with the same id', () => {
      messageManager.addMsg({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TRANSACTION_STATUSES.APPROVED,
        metamaskNetworkId: 'unit test',
      });
      messageManager._updateMsg({
        id: '1',
        status: 'blah',
        hash: 'foo',
        metamaskNetworkId: 'unit test',
      });
      const result = messageManager.getMsg('1');
      expect(result.hash).toStrictEqual('foo');
    });
  });

  describe('#getUnapprovedMsgs', () => {
    it('returns unapproved Msgs in a hash', () => {
      messageManager.addMsg({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TRANSACTION_STATUSES.APPROVED,
        metamaskNetworkId: 'unit test',
      });
      const result = messageManager.getUnapprovedMsgs();
      expect(typeof result).toStrictEqual('object');
      expect(result['1'].status).toStrictEqual(TRANSACTION_STATUSES.UNAPPROVED);
      expect(result['2']).toBeUndefined();
    });
  });

  describe('#getMsg', () => {
    it('returns a Msg with the requested id', () => {
      messageManager.addMsg({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: 'unit test',
      });
      messageManager.addMsg({
        id: '2',
        status: TRANSACTION_STATUSES.APPROVED,
        metamaskNetworkId: 'unit test',
      });
      expect(messageManager.getMsg('1').status).toStrictEqual(
        TRANSACTION_STATUSES.UNAPPROVED,
      );
      expect(messageManager.getMsg('2').status).toStrictEqual(
        TRANSACTION_STATUSES.APPROVED,
      );
    });
  });

  describe('#normalizeMsgData', () => {
    it('converts text to a utf8 hex string', () => {
      const input = 'hello';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x68656c6c6f');
    });

    it('tolerates a hex prefix', () => {
      const input = '0x12';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x12');
    });

    it('tolerates normal hex', () => {
      const input = '12';
      const output = messageManager.normalizeMsgData(input);
      expect(output).toStrictEqual('0x12');
    });
  });
});

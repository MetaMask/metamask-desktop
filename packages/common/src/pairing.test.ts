import ObjectMultiplex from 'obj-multiplex';
import {
  createMultiplexMock,
  createStreamMock,
  DECRYPTED_STRING_MOCK,
  HASH_BUFFER_2_HEX_MOCK,
  HASH_BUFFER_HEX_MOCK,
  OTP_MOCK,
  STRING_DATA_MOCK,
} from '../test/mocks';
import { flushPromises, simulateStreamMessage } from '../test/utils';
import { browser } from './browser';
import { MESSAGE_ACKNOWLEDGE } from './constants';
import * as RawState from './utils/state';
import TOTP from './utils/totp';
import * as encryption from './encryption/symmetric';
import { hashString } from './utils/crypto';
import { Pairing } from './pairing';
import { PairingKeyStatus } from './types';

jest.mock('./utils/totp');
jest.mock('./encryption/symmetric');
jest.mock('obj-multiplex');

jest.mock('./utils/crypto', () => ({
  randomHex: jest.fn(() => []),
  hashString: jest.fn(),
}));

jest.mock('./browser', () => ({
  browser: {
    runtime: { reload: jest.fn() },
  },
}));

jest.mock('./utils/state', () => ({
  getDesktopState: jest.fn(),
  setDesktopState: jest.fn(),
}));

describe('Pairing', () => {
  const streamMock = createStreamMock();
  const browserMock = browser as any;
  const totpMock = TOTP as jest.Mocked<typeof TOTP>;
  const rawStateMock = RawState as jest.Mocked<typeof RawState>;
  const encryptionMock = encryption as jest.Mocked<typeof encryption>;
  const multiplexMock = createMultiplexMock();
  const requestStreamMock = createStreamMock();
  const keyStreamMock = createStreamMock();
  const multiplexConstructorMock = ObjectMultiplex as any;
  const hashStringMock = hashString as jest.MockedFunction<typeof hashString>;
  const transferStateMock = jest.fn();
  let extensionPairing: Pairing;

  beforeEach(() => {
    jest.resetAllMocks();

    streamMock.pipe.mockReturnValue(multiplexMock);
    multiplexMock.createStream.mockReturnValueOnce(requestStreamMock as any);
    multiplexMock.createStream.mockReturnValueOnce(keyStreamMock as any);
    multiplexConstructorMock.mockReturnValue(multiplexMock);

    extensionPairing = new Pairing(streamMock, transferStateMock).init();
  });

  describe('generateOTP', () => {
    it('returns value from TOTP', () => {
      totpMock.generate.mockReturnValue(OTP_MOCK);

      expect(Pairing.generateOTP()).toStrictEqual(OTP_MOCK);
      expect(TOTP.generate).toHaveBeenCalledTimes(1);
    });
  });

  describe('on message', () => {
    const simulatePairingMessage = async () => {
      await simulateStreamMessage(requestStreamMock, {
        otp: OTP_MOCK,
      });
    };

    describe('if OTP is valid', () => {
      beforeEach(async () => {
        encryptionMock.createKey.mockResolvedValue(DECRYPTED_STRING_MOCK);
        hashStringMock.mockResolvedValueOnce(STRING_DATA_MOCK);

        totpMock.validate.mockReturnValue(true);

        await simulatePairingMessage();
        await flushPromises();
        await simulateStreamMessage(requestStreamMock, MESSAGE_ACKNOWLEDGE);
      });

      it('updates state', async () => {
        expect(rawStateMock.setDesktopState).toHaveBeenCalledTimes(1);
        expect(rawStateMock.setDesktopState).toHaveBeenCalledWith({
          desktopEnabled: true,
          pairingKeyHash: STRING_DATA_MOCK,
        });
      });

      it('restarts extension', async () => {
        expect(browserMock.runtime.reload).toHaveBeenCalledTimes(1);
      });

      it('writes message to pairing request stream', async () => {
        expect(requestStreamMock.write).toHaveBeenCalledTimes(1);
        expect(requestStreamMock.write).toHaveBeenCalledWith({
          isDesktopEnabled: true,
          pairingKey: DECRYPTED_STRING_MOCK,
        });
      });
    });

    describe('if OTP is invalid', () => {
      beforeEach(async () => {
        totpMock.validate.mockReturnValue(false);
        await simulatePairingMessage();
      });

      it('writes message to pairing request stream', async () => {
        expect(requestStreamMock.write).toHaveBeenCalledTimes(1);
        expect(requestStreamMock.write).toHaveBeenCalledWith({
          isDesktopEnabled: false,
          pairingKey: undefined,
        });
      });
    });
  });

  describe('checkPairingKeyMatch', () => {
    it('sends request message to desktop', async () => {
      extensionPairing.checkPairingKeyMatch();
      await simulateStreamMessage(keyStreamMock, {});

      expect(keyStreamMock.write).toHaveBeenCalledTimes(1);
      expect(keyStreamMock.write).toHaveBeenCalledWith({
        isRequestPairingKey: true,
      });
    });

    it('returns pairingKeyMatch is desktop responds with pairing key matching extension hash', async () => {
      const pairingKeyStatusPromise = extensionPairing.checkPairingKeyMatch();

      hashStringMock.mockResolvedValueOnce(HASH_BUFFER_HEX_MOCK);

      rawStateMock.getDesktopState.mockResolvedValueOnce({
        pairingKeyHash: HASH_BUFFER_HEX_MOCK,
      });

      await simulateStreamMessage(keyStreamMock, {
        pairingKey: STRING_DATA_MOCK,
      });

      expect(await pairingKeyStatusPromise).toBe(PairingKeyStatus.MATCH);
    });

    it('returns pairingKeyNotMatch is desktop responds with no pairing key', async () => {
      const pairingKeyStatusPromise = extensionPairing.checkPairingKeyMatch();
      await simulateStreamMessage(keyStreamMock, {});
      expect(await pairingKeyStatusPromise).toBe(PairingKeyStatus.MISSING);
    });

    it('returns pairingKeyNotMatch is desktop responds with pairing key not matching extension hash', async () => {
      const pairingKeyStatusPromise = extensionPairing.checkPairingKeyMatch();

      hashStringMock.mockResolvedValueOnce(HASH_BUFFER_HEX_MOCK);

      rawStateMock.getDesktopState.mockResolvedValueOnce({
        pairingKeyHash: HASH_BUFFER_2_HEX_MOCK,
      });

      await simulateStreamMessage(keyStreamMock, {
        pairingKey: STRING_DATA_MOCK,
      });

      expect(await pairingKeyStatusPromise).toBe(PairingKeyStatus.NO_MATCH);
    });
  });
});

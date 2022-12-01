import ObjectMultiplex from 'obj-multiplex';
import { browser } from '@metamask/desktop/dist/browser';
import { MESSAGE_ACKNOWLEDGE } from '@metamask/desktop/dist/constants';
import * as RawState from '@metamask/desktop/dist/utils/state';
import TOTP from '@metamask/desktop/dist/utils/totp';
import * as encryption from '@metamask/desktop/dist/encryption/symmetric';
import { hashString } from '@metamask/desktop/dist/utils/crypto';
import { PairingKeyStatus } from '@metamask/desktop/dist/types';
import {
  createMultiplexMock,
  createStreamMock,
  DECRYPTED_STRING_MOCK,
  HASH_BUFFER_2_HEX_MOCK,
  HASH_BUFFER_HEX_MOCK,
  OTP_MOCK,
  STRING_DATA_MOCK,
} from '../../test/mocks';
import {
  expectEventToFire,
  flushPromises,
  simulateStreamMessage,
} from '../../test/utils';
import { DesktopPairing, ExtensionPairing } from './pairing';

jest.mock('@metamask/desktop/dist/utils/totp');
jest.mock('@metamask/desktop/dist/encryption/symmetric');
jest.mock('obj-multiplex');

jest.mock('@metamask/desktop/dist/utils/crypto', () => ({
  randomHex: jest.fn(() => []),
  hashString: jest.fn(),
}));

jest.mock('@metamask/desktop/dist/browser', () => ({
  browser: {
    runtime: { reload: jest.fn() },
  },
}));

jest.mock('@metamask/desktop/dist/utils/state', () => ({
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

  beforeEach(() => {
    jest.resetAllMocks();

    streamMock.pipe.mockReturnValue(multiplexMock);
    multiplexMock.createStream.mockReturnValueOnce(requestStreamMock as any);
    multiplexMock.createStream.mockReturnValueOnce(keyStreamMock as any);
    multiplexConstructorMock.mockReturnValue(multiplexMock);
  });

  describe('Extension', () => {
    const transferStateMock = jest.fn();
    let extensionPairing: ExtensionPairing;

    beforeEach(() => {
      extensionPairing = new ExtensionPairing(
        streamMock,
        transferStateMock,
      ).init();
    });

    describe('generateOTP', () => {
      it('returns value from TOTP', () => {
        totpMock.generate.mockReturnValue(OTP_MOCK);

        expect(ExtensionPairing.generateOTP()).toStrictEqual(OTP_MOCK);
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

  describe('Desktop', () => {
    let desktopPairing: DesktopPairing;

    beforeEach(() => {
      streamMock.pipe.mockReturnValue(multiplexMock);
      multiplexMock.createStream.mockReturnValueOnce(requestStreamMock as any);
      multiplexMock.createStream.mockReturnValueOnce(keyStreamMock as any);

      desktopPairing = new DesktopPairing(streamMock).init();
    });

    describe('submitOTP', () => {
      it('writes message to stream', () => {
        desktopPairing.submitOTP(OTP_MOCK);

        expect(requestStreamMock.write).toHaveBeenCalledTimes(1);
        expect(requestStreamMock.write).toHaveBeenCalledWith({
          otp: OTP_MOCK,
        });
      });
    });

    describe('on request message', () => {
      // eslint-disable-next-line jest/expect-expect
      it('emits event if not successful', async () => {
        await expectEventToFire(
          desktopPairing,
          'invalid-otp',
          undefined,
          async () => {
            await simulateStreamMessage(requestStreamMock, {
              isDesktopEnabled: false,
            });
          },
        );
      });

      it('updates state with pairing key if successful', async () => {
        await simulateStreamMessage(requestStreamMock, {
          isDesktopEnabled: true,
          pairingKey: DECRYPTED_STRING_MOCK,
        });

        expect(rawStateMock.setDesktopState).toHaveBeenCalledTimes(1);
        expect(rawStateMock.setDesktopState).toHaveBeenCalledWith({
          desktopEnabled: true,
          pairingKey: DECRYPTED_STRING_MOCK,
        });
      });

      it('sends acknowledge if successful', async () => {
        await simulateStreamMessage(requestStreamMock, {
          isDesktopEnabled: true,
          pairingKey: DECRYPTED_STRING_MOCK,
        });

        expect(requestStreamMock.write).toHaveBeenCalledTimes(1);
        expect(requestStreamMock.write).toHaveBeenCalledWith(
          MESSAGE_ACKNOWLEDGE,
        );
      });
    });

    describe('on key message', () => {
      it('replies with pairing key', async () => {
        rawStateMock.getDesktopState.mockResolvedValueOnce({
          pairingKey: DECRYPTED_STRING_MOCK,
        });

        await simulateStreamMessage(keyStreamMock, {});

        expect(keyStreamMock.write).toHaveBeenCalledTimes(1);
        expect(keyStreamMock.write).toHaveBeenCalledWith({
          pairingKey: DECRYPTED_STRING_MOCK,
        });
      });
    });
  });
});

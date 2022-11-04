import ObjectMultiplex from 'obj-multiplex';
import TOTP from '../utils/totp';
import {
  createMultiplexMock,
  createStreamMock,
  DECRYPTED_STRING_MOCK,
  OTP_MOCK,
  STRING_DATA_MOCK,
} from '../test/mocks';
import {
  expectEventToFire,
  flushPromises,
  simulateStreamMessage,
} from '../test/utils';
import { browser } from '../browser/browser-polyfill';
import * as RawState from '../utils/raw-state';
import { MESSAGE_ACKNOWLEDGE } from '../../../../shared/constants/desktop';
import * as encryption from '../encryption/symmetric-encryption';
import { hashString } from '../utils/crypto';
import { DesktopPairing, ExtensionPairing } from './pairing';

jest.mock('../utils/totp');
jest.mock('../utils/raw-state');
jest.mock('../encryption/symmetric-encryption');
jest.mock('obj-multiplex');
jest.mock('../utils/crypto');

jest.mock(
  '../browser/browser-polyfill',
  () => ({
    browser: {
      runtime: { reload: jest.fn() },
    },
  }),
  {
    virtual: true,
  },
);

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
    multiplexMock.createStream.mockReturnValueOnce(requestStreamMock);
    multiplexMock.createStream.mockReturnValueOnce(keyStreamMock);
    multiplexConstructorMock.mockReturnValue(multiplexMock);
  });

  describe('Extension', () => {
    const transferStateMock = jest.fn();

    beforeEach(() => {
      new ExtensionPairing(streamMock, transferStateMock).init();
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
          });
        });
      });
    });
  });

  describe('Desktop', () => {
    let desktopPairing: DesktopPairing;

    beforeEach(() => {
      streamMock.pipe.mockReturnValue(multiplexMock);
      multiplexMock.createStream.mockReturnValueOnce(requestStreamMock);
      multiplexMock.createStream.mockReturnValueOnce(keyStreamMock);

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

    describe('on message', () => {
      // eslint-disable-next-line jest/expect-expect
      it('emits event if not paired', async () => {
        expectEventToFire(
          desktopPairing,
          'invalid-otp',
          undefined,
          async () => {
            await simulateStreamMessage(streamMock, {});
          },
        );
      });
    });
  });
});

import TOTP from '../utils/totp';
import {
  createStreamMock,
  DECRYPTED_STRING_MOCK,
  OTP_MOCK,
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
import { DesktopPairing, ExtensionPairing } from './pairing';

jest.mock('../utils/totp');
jest.mock('../utils/raw-state');
jest.mock('../encryption/symmetric-encryption');

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

  beforeEach(() => {
    jest.resetAllMocks();
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
        await simulateStreamMessage(streamMock, {
          otp: OTP_MOCK,
        });
      };

      describe('if OTP is valid', () => {
        beforeEach(async () => {
          encryptionMock.createKey.mockImplementation(
            async () => DECRYPTED_STRING_MOCK,
          );
          totpMock.validate.mockReturnValue(true);
          await simulatePairingMessage();
          await flushPromises();
          await simulateStreamMessage(streamMock, MESSAGE_ACKNOWLEDGE);
        });

        it('updates state', async () => {
          expect(rawStateMock.setDesktopState).toHaveBeenCalledTimes(1);
          expect(rawStateMock.setDesktopState).toHaveBeenCalledWith({
            desktopEnabled: true,
            pairingKey: DECRYPTED_STRING_MOCK,
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

        it('writes message to pairing stream', async () => {
          expect(streamMock.write).toHaveBeenCalledTimes(1);
          expect(streamMock.write).toHaveBeenCalledWith({
            isPaired: false,
            otp: OTP_MOCK,
          });
        });
      });
    });
  });

  describe('Desktop', () => {
    let desktopPairing: DesktopPairing;

    beforeEach(() => {
      desktopPairing = new DesktopPairing(streamMock).init();
    });

    describe('submitOTP', () => {
      it('writes message to stream', () => {
        desktopPairing.submitOTP(OTP_MOCK);

        expect(streamMock.write).toHaveBeenCalledTimes(1);
        expect(streamMock.write).toHaveBeenCalledWith({
          otp: OTP_MOCK,
          isPaired: false,
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
            await simulateStreamMessage(streamMock, { isPaired: false });
          },
        );
      });
    });
  });
});

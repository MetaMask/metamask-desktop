import * as totp from '../../../../shared/modules/totp';
import { DATA_MOCK, createStreamMock, OTP_MOCK } from '../test/mocks';
import { expectEventToFire, simulateStreamMessage } from '../test/utils';
import { browser } from '../browser/browser-polyfill';
import { DesktopPairing, ExtensionPairing } from './pairing';

jest.mock('../../../../shared/modules/totp');

jest.mock(
  '../browser/browser-polyfill',
  () => ({
    browser: {
      storage: { local: { get: jest.fn(), set: jest.fn() } },
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
  const totpMock = totp as jest.Mocked<typeof totp>;

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
        expect(totp.generate).toHaveBeenCalledTimes(1);
      });
    });

    describe('on message', () => {
      const DATA_MOCK_STATE_PAIRED = {
        ...DATA_MOCK,
        data: {
          DesktopController: { desktopEnabled: true },
        },
      };

      const simulatePairingMessage = async () => {
        await simulateStreamMessage(streamMock, {
          otp: OTP_MOCK,
        });
      };

      describe('if OTP is valid', () => {
        beforeEach(async () => {
          totpMock.validate.mockReturnValue(true);

          browserMock.storage.local.get.mockResolvedValue({
            ...DATA_MOCK,
            data: {
              DesktopController: { desktopEnabled: true },
            },
          });

          await simulatePairingMessage();
        });

        it('updates state', async () => {
          expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
          expect(browser.storage.local.set).toHaveBeenCalledWith(
            DATA_MOCK_STATE_PAIRED,
          );
        });

        it('restarts extension', async () => {
          expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
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

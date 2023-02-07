import ObjectMultiplex from 'obj-multiplex';
import { MESSAGE_ACKNOWLEDGE } from '@metamask/desktop/dist/constants';
import * as RawState from '@metamask/desktop/dist/utils/state';
import {
  createMultiplexMock,
  createStreamMock,
  DECRYPTED_STRING_MOCK,
  OTP_MOCK,
} from '../../test/mocks';
import { expectEventToFire, simulateStreamMessage } from '../../test/utils';
import { DesktopPairing } from './pairing';

jest.mock('@metamask/desktop/dist/utils/totp');
jest.mock('@metamask/desktop/dist/encryption/symmetric');
jest.mock('obj-multiplex');

jest.mock('@metamask/desktop/dist/utils/crypto', () => ({
  randomHex: jest.fn(() => []),
  hashString: jest.fn(),
}));

jest.mock('@metamask/desktop/dist/utils/state', () => ({
  getDesktopState: jest.fn(),
  setDesktopState: jest.fn(),
}));

describe('Pairing', () => {
  const streamMock = createStreamMock();
  const rawStateMock = RawState as jest.Mocked<typeof RawState>;
  const multiplexMock = createMultiplexMock();
  const requestStreamMock = createStreamMock();
  const keyStreamMock = createStreamMock();
  const multiplexConstructorMock = ObjectMultiplex as any;
  let desktopPairing: DesktopPairing;

  beforeEach(() => {
    jest.resetAllMocks();

    streamMock.pipe.mockReturnValue(multiplexMock);
    multiplexMock.createStream.mockReturnValueOnce(requestStreamMock as any);
    multiplexMock.createStream.mockReturnValueOnce(keyStreamMock as any);
    multiplexConstructorMock.mockReturnValue(multiplexMock);

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
      expect(requestStreamMock.write).toHaveBeenCalledWith(MESSAGE_ACKNOWLEDGE);
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

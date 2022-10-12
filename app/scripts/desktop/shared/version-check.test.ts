import { createStreamMock, VERSION_2_MOCK, VERSION_MOCK } from '../test/mocks';
import { simulateStreamMessage } from '../test/utils';
import { VersionCheckResult } from '../types/desktop';
import { getVersion } from '../utils/version';
import { DesktopVersionCheck, ExtensionVersionCheck } from './version-check';

jest.mock('../utils/version');

describe('Version Check', () => {
  const streamMock = createStreamMock();
  const getVersionMock = getVersion as jest.MockedFunction<typeof getVersion>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('Desktop', () => {
    beforeEach(() => {
      new DesktopVersionCheck(streamMock).init();
    });

    describe('on message', () => {
      it('writes desktop version and extension validity to stream', async () => {
        getVersionMock.mockReturnValueOnce(VERSION_MOCK);
        await simulateStreamMessage(streamMock, { version: VERSION_MOCK });

        expect(streamMock.write).toHaveBeenCalledTimes(1);
        expect(streamMock.write).toHaveBeenCalledWith({
          version: VERSION_MOCK,
          isValid: true,
        });
      });
    });
  });

  describe('Extension', () => {
    let extensionVersionCheck: ExtensionVersionCheck;

    beforeEach(() => {
      extensionVersionCheck = new ExtensionVersionCheck(streamMock);
    });

    describe('check', () => {
      const check = async (): Promise<VersionCheckResult> => {
        const promise = extensionVersionCheck.check();

        await simulateStreamMessage(streamMock, {
          version: VERSION_2_MOCK,
          isValid: false,
        });

        return await promise;
      };

      it('writes extension version to stream', async () => {
        getVersionMock.mockReturnValueOnce(VERSION_MOCK);

        await check();

        expect(streamMock.write).toHaveBeenCalledTimes(1);
        expect(streamMock.write).toHaveBeenCalledWith({
          version: VERSION_MOCK,
        });
      });

      it('returns result using response', async () => {
        getVersionMock.mockReturnValueOnce(VERSION_MOCK);

        const result = await check();

        expect(result).toStrictEqual({
          extensionVersion: VERSION_MOCK,
          desktopVersion: VERSION_2_MOCK,
          isExtensionVersionValid: false,
          isDesktopVersionValid: true,
        });
      });
    });
  });
});

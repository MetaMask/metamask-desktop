import { createStreamMock, VERSION_2_MOCK, VERSION_MOCK } from '../test/mocks';
import { simulateStreamMessage } from '../test/utils';
import { CheckVersionResponseMessage, VersionCheckResult } from './types';
import { VersionCheck } from './version-check';

describe('Version Check', () => {
  const streamMock = createStreamMock();
  const getVersionMock = jest.fn();
  let extensionVersionCheck: VersionCheck;

  beforeEach(() => {
    jest.resetAllMocks();

    extensionVersionCheck = new VersionCheck(streamMock, getVersionMock);
  });

  describe('check', () => {
    const check = async ({
      isExtensionSupported = true,
      desktopCompatibilityVersion = 1,
    }: {
      isExtensionSupported?: boolean;
      desktopCompatibilityVersion?: number;
    } = {}): Promise<VersionCheckResult> => {
      const promise = extensionVersionCheck.check();

      const checkVersionResponse: CheckVersionResponseMessage = {
        desktopVersionData: {
          version: VERSION_2_MOCK,
          compatibilityVersion: desktopCompatibilityVersion,
        },
        isExtensionSupported,
      };

      await simulateStreamMessage(streamMock, checkVersionResponse);

      return await promise;
    };

    it('writes extension version to stream', async () => {
      getVersionMock.mockReturnValueOnce(VERSION_MOCK);

      await check();

      expect(streamMock.write).toHaveBeenCalledTimes(1);
      expect(streamMock.write).toHaveBeenCalledWith({
        extensionVersionData: {
          version: VERSION_MOCK,
          compatibilityVersion: 1,
        },
      });
    });

    it.each([
      ['valid', 'supported', true],
      ['invalid', 'unsupported', false],
    ])(
      'returns result with extension version %s if %s in response',
      async (_: string, __: string, isExtensionSupported: boolean) => {
        getVersionMock.mockReturnValueOnce(VERSION_MOCK);

        const result = await check({ isExtensionSupported });

        expect(result).toStrictEqual({
          extensionVersion: VERSION_MOCK,
          desktopVersion: VERSION_2_MOCK,
          isExtensionVersionValid: isExtensionSupported,
          isDesktopVersionValid: true,
        });
      },
    );

    it.each([
      ['valid', 'matches', 1, true],
      ['invalid', 'less than', 0, false],
      ['valid', 'greater than', 2, true],
    ])(
      'returns result with desktop version %s if desktop compatibility version %s',
      async (
        _: string,
        __: string,
        desktopCompatibilityVersion: number,
        isDesktopValid: boolean,
      ) => {
        getVersionMock.mockReturnValueOnce(VERSION_MOCK);

        const result = await check({ desktopCompatibilityVersion });

        expect(result).toStrictEqual({
          extensionVersion: VERSION_MOCK,
          desktopVersion: VERSION_2_MOCK,
          isExtensionVersionValid: true,
          isDesktopVersionValid: isDesktopValid,
        });
      },
    );
  });
});

import { createStreamMock, VERSION_2_MOCK, VERSION_MOCK } from '../test/mocks';
import { simulateStreamMessage } from '../test/utils';
import { VersionCheckResult } from '../types/desktop';
import { CheckVersionResponseMessage } from '../types/message';
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
      it.each([
        ['supported', 'matches', 1, true],
        ['unsupported', 'less than', 0, false],
        ['supported', 'greater than', 2, true],
      ])(
        'responds indicating extension %s if extension compatibility version %s',
        async (
          _: string,
          __: string,
          extensionCompatibilityVersion: number,
          isExtensionSupported: boolean,
        ) => {
          getVersionMock.mockReturnValueOnce(VERSION_2_MOCK);

          await simulateStreamMessage(streamMock, {
            extensionVersionData: {
              version: VERSION_MOCK,
              compatibilityVersion: extensionCompatibilityVersion,
            },
          });

          expect(streamMock.write).toHaveBeenCalledTimes(1);
          expect(streamMock.write).toHaveBeenCalledWith({
            desktopVersionData: {
              version: VERSION_2_MOCK,
              compatibilityVersion: 1,
            },
            isExtensionSupported,
          });
        },
      );
    });
  });

  describe('Extension', () => {
    let extensionVersionCheck: ExtensionVersionCheck;

    beforeEach(() => {
      extensionVersionCheck = new ExtensionVersionCheck(streamMock);
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
});

import {
  createStreamMock,
  VERSION_2_MOCK,
  VERSION_MOCK,
} from '../../test/mocks';
import { simulateStreamMessage } from '../../test/utils';
import { getDesktopVersion } from '../utils/version';
import { DesktopVersionCheck } from './version-check';

jest.mock('../utils/version');

describe('Desktop Version Check', () => {
  const streamMock = createStreamMock();
  const getDesktopVersionMock = getDesktopVersion as jest.MockedFunction<
    typeof getDesktopVersion
  >;

  beforeEach(() => {
    jest.resetAllMocks();
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
        getDesktopVersionMock.mockReturnValueOnce(VERSION_2_MOCK);

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

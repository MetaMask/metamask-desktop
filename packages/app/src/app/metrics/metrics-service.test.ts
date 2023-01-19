import log from 'loglevel';
import Store from 'electron-store';
import {
  EVENT_NAME_MOCK,
  PROPERTIES_OBJECT_MOCK,
  UUID_MOCK,
  VERSION_MOCK,
  createElectronStoreMock,
} from '../../../test/mocks';
import MetricsService from './metrics-service';
import Analytics from './analytics';

jest.mock(
  'electron-store',
  () => {
    return jest.fn().mockImplementation(() => {
      return {
        get: jest.fn().mockImplementation((value) => {
          switch (value) {
            case 'participateInDesktopMetrics':
              return true;
            case 'segmentApiCalls':
              return {};
            default:
              return undefined;
          }
        }),
        set: jest.fn(),
      };
    });
  },
  {
    virtual: true,
  },
);

jest.mock(
  'electron',
  () => ({
    app: { name: jest.fn() },
  }),
  {
    virtual: true,
  },
);

jest.mock('loglevel');

describe('MetricsService', () => {
  let metricsService: typeof MetricsService;
  let analytics: Analytics;
  const electronStoreConstructorMock = Store as jest.MockedClass<typeof Store>;
  const storeMock = createElectronStoreMock();

  beforeEach(() => {
    process.env.PACKAGE_VERSION = VERSION_MOCK;
    metricsService = MetricsService as any;
    analytics = Analytics.getInstance();
    electronStoreConstructorMock.mockReturnValue(storeMock);
  });

  it('tracks an event with properties and saved it to the store', () => {
    const trackSpy = jest.spyOn(analytics, 'track');
    metricsService.track(EVENT_NAME_MOCK, PROPERTIES_OBJECT_MOCK);

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith({
      event: EVENT_NAME_MOCK,
      userId: expect.any(String),
      properties: PROPERTIES_OBJECT_MOCK,
      context: expect.any(Object),
      messageId: expect.any(String),
    });
  });

  it('set participateInDesktopMetrics', () => {
    metricsService.setParticipateInDesktopMetrics(false);
    expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
  });

  it('set desktopMetricsId', () => {
    metricsService.setDesktopMetricsId(UUID_MOCK);
    expect(electronStoreConstructorMock).toHaveBeenCalledTimes(1);
  });

  it('flush events before optIn', () => {
    metricsService.flushEventsBeforeOptIn();
    expect(log.debug).toHaveBeenCalledWith('No implementation provided');
  });
});

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
import { MetricsDecision } from './metrics-constants';

jest.mock(
  '../storage/ui-storage',
  () => ({
    readPersistedSettingFromAppState: jest.fn().mockReturnValueOnce(true),
  }),
  {
    virtual: true,
  },
);

jest.mock(
  'electron-store',
  () => {
    return jest.fn().mockImplementation(() => {
      return {
        get: jest.fn().mockImplementation((value) => {
          switch (value) {
            case 'participateInDesktopMetrics':
              return true;
            case 'eventsSavedBeforeMetricsDecision':
              return [];
            case 'processedEvents':
              return ['mock-event-name-2'];
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
    ipcMain: { handle: jest.fn() },
  }),
  {
    virtual: true,
  },
);

jest.mock('loglevel');

describe('MetricsService', () => {
  let metricsService: typeof MetricsService;
  let analytics: typeof Analytics;
  let trackSpy: jest.SpyInstance;
  let identifySpy: jest.SpyInstance;
  let getMetricsDecisionSpy: jest.SpyInstance;
  let saveProcessedEventsSpy: jest.SpyInstance;
  const electronStoreConstructorMock = Store as jest.MockedClass<typeof Store>;
  const storeMock = createElectronStoreMock();

  beforeEach(() => {
    process.env.PACKAGE_VERSION = VERSION_MOCK;
    metricsService = MetricsService as any;
    analytics = Analytics;
    electronStoreConstructorMock.mockReturnValue(storeMock);
    trackSpy = jest.spyOn(analytics, 'track');
    identifySpy = jest.spyOn(analytics, 'identify');
    getMetricsDecisionSpy = jest.spyOn(
      metricsService as any,
      'getMetricsDecision',
    );

    saveProcessedEventsSpy = jest.spyOn(
      metricsService as any,
      'saveProcessedEvents',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('track events', () => {
    it.each([true, false])(
      `tracks an event with the property firstTimeEvent $firstTimeEvent and saved it to the store`,
      (firstTimeEvent) => {
        getMetricsDecisionSpy.mockReturnValue(MetricsDecision.ENABLED);
        metricsService.track(EVENT_NAME_MOCK, PROPERTIES_OBJECT_MOCK);

        expect(trackSpy).toHaveBeenCalledTimes(1);
        expect(analytics.track).toHaveBeenCalledWith({
          event: EVENT_NAME_MOCK,
          userId: expect.any(String),
          properties: {
            ...PROPERTIES_OBJECT_MOCK,
            firstTimeEvent,
          },
          context: expect.any(Object),
          messageId: expect.any(String),
        });
      },
    );
  });

  it('should not send events to segment if user disables metrics', () => {
    getMetricsDecisionSpy.mockReturnValue(MetricsDecision.DISABLED);
    metricsService.track(EVENT_NAME_MOCK, PROPERTIES_OBJECT_MOCK);

    expect(trackSpy).toHaveBeenCalledTimes(0);
    expect(saveProcessedEventsSpy).toHaveBeenCalledTimes(0);
  });

  it('tracks an event before users opted in and store it in eventsSavedBeforeMetricsDecision', () => {
    getMetricsDecisionSpy.mockReturnValue(MetricsDecision.PENDING);
    metricsService.track(EVENT_NAME_MOCK, PROPERTIES_OBJECT_MOCK);

    expect(trackSpy).toHaveBeenCalledTimes(0);
    expect(saveProcessedEventsSpy).toHaveBeenCalledTimes(1);
    expect(saveProcessedEventsSpy).toHaveBeenCalledWith(EVENT_NAME_MOCK);
  });

  it('should call identify and send it to Segment when the user has opted in', () => {
    const traits = PROPERTIES_OBJECT_MOCK;
    (metricsService as any).desktopMetricsId = UUID_MOCK;

    metricsService.identify(traits);

    expect(identifySpy).toHaveBeenCalledTimes(1);
    expect(analytics.identify).toHaveBeenCalledWith({
      userId: UUID_MOCK,
      traits,
      context: {
        app: {
          name: expect.anything(),
          version: expect.any(String),
        },
      },
    });
  });

  it('should not call identify when the user has opted out', () => {
    const traits = PROPERTIES_OBJECT_MOCK;
    getMetricsDecisionSpy.mockReturnValue(MetricsDecision.DISABLED);

    metricsService.identify(traits);

    expect(identifySpy).toHaveBeenCalledTimes(0);
  });
});

import {
  PROPERTIES_OBJECT_MOCK,
  UUID_MOCK,
  EVENT_NAME_MOCK,
} from '../../../test/mocks';
import Analytics from './analytics';

jest.mock('analytics-node');

describe('Analytics', () => {
  let analytics: Analytics;

  beforeEach(() => {
    analytics = Analytics.getInstance();
  });

  it('creates a singleton instance of Analytics', () => {
    const anotherAnalytics = Analytics.getInstance();
    expect(analytics).toBe(anotherAnalytics);
  });

  it('calls identify on the analytics-node instance', () => {
    const spy = jest.spyOn(analytics, 'identify');
    const userId = UUID_MOCK;
    const traits = { name: 'mock-name' };
    analytics.identify(userId, traits);
    expect(spy).toHaveBeenCalledWith(userId, traits);
  });

  it('calls track on the analytics-node instance', () => {
    const spy = jest.spyOn(analytics, 'track');
    const message = {
      event: EVENT_NAME_MOCK,
      userId: UUID_MOCK,
      properties: PROPERTIES_OBJECT_MOCK,
      context: { location: 'US' },
    };
    analytics.track(message);
    expect(spy).toHaveBeenCalledWith({
      ...message,
    });
  });
});

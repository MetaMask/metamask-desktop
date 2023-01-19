import AnalyticsNode from 'analytics-node';
import cfg from '../../utils/config';

export default class Analytics {
  private static instance: Analytics;

  private analytics: AnalyticsNode;

  private constructor() {
    this.analytics = new AnalyticsNode(cfg().segmentWriteKey);
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  public identify(userId: string | undefined, traits: object): void {
    this.analytics.identify({
      userId,
      traits,
      timestamp: new Date(),
    });
  }

  /* The track method lets you record the actions your users perform. */
  public track(message: {
    event: string;
    userId?: string;
    properties?: any;
    context?: any;
  }): void {
    this.analytics.track({ ...message, timestamp: new Date() });
  }
}

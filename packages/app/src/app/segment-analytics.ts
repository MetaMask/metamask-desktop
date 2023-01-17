import Analytics from 'analytics-node';
import cfg from '../utils/config';

export default class AnalyticsService {
  private static instance: AnalyticsService;

  private analytics: Analytics;

  private constructor() {
    this.analytics = new Analytics(cfg().segmentWriteKey);
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  public identify(userId: string, traits: object, timestamp?: Date): void {
    this.analytics.identify({ userId, traits, timestamp: timestamp || new Date() });
  }

  /* The track method lets you record the actions your users perform. */
  public track(userId: string, event: string, properties: object, timestamp?: Date): void {
    this.analytics.track({ userId, event, properties, timestamp: timestamp || new Date() });
  }
}

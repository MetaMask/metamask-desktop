import AnalyticsNode from 'analytics-node';
import cfg from '../../utils/config';
import { Identity } from '../../types/metrics';

class Analytics {
  private static instance: AnalyticsNode;

  constructor() {
    this.init();
  }

  public identify(
    message: Identity & {
      traits?: any;
      timestamp?: Date | undefined;
      context?: any;
    },
  ): void {
    Analytics.instance.identify({ ...message, timestamp: new Date() });
  }

  public track(
    message: Identity & {
      event: string;
      properties?: any;
      timestamp?: Date | undefined;
      context?: any;
    },
  ): void {
    Analytics.instance.track({ ...message, timestamp: new Date() });
  }

  private init = () => {
    if (!Analytics.instance) {
      Analytics.instance = new AnalyticsNode(cfg().segmentWriteKey);
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

export default new Analytics();

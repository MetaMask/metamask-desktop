import AnalyticsNode from 'analytics-node';
import cfg from '../utils/config';
import { Identity } from '../types/metrics';

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
    Analytics.instance.identify({
      ...message,
      timestamp: message.timestamp || new Date(),
    });
  }

  public track(
    message: Identity & {
      event: string;
      properties?: any;
      timestamp?: Date | undefined;
      context?: any;
    },
  ): void {
    Analytics.instance.track({
      ...message,
      timestamp: message.timestamp || new Date(),
    });
  }

  public page(
    message: Identity & {
      category?: string | undefined;
      name?: string | undefined;
      properties?: any;
      timestamp?: Date | undefined;
      context?: any;
      messageId?: string | undefined;
    },
  ): void {
    Analytics.instance.page({
      ...message,
      timestamp: message.timestamp || new Date(),
    });
  }

  public screen(
    message: Identity & {
      name?: string | undefined;
      properties?: any;
      timestamp?: Date | undefined;
      context?: any;
    },
  ): void {
    Analytics.instance.screen({
      ...message,
      timestamp: message.timestamp || new Date(),
    });
  }

  private init = () => {
    if (!Analytics.instance) {
      Analytics.instance = new AnalyticsNode(cfg().segmentWriteKey);
    }
  };
}

export default new Analytics();

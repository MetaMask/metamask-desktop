import Store from 'electron-store';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import log from 'loglevel';
import { app } from 'electron';
import { getDesktopVersion } from '../../utils/version';
import {
  MetricsState,
  Properties,
  SegmentApiCalls,
  Traits,
  Event,
} from '../../types/metrics';
import { readPersistedSettingFromAppState } from '../ui-storage';
import Analytics from './analytics';

class MetricsService {
  private store: Store<MetricsState>;

  private analytics: typeof Analytics;

  // Unique identifier representing userId property on events
  private desktopMetricsId?: string;

  // Events saved before users opt-in/opt-out of metrics
  private eventsBeforeMetricsOptIn: Event[];

  // Traits are pieces of information you know about a user that are included in an identify call
  private traits: Traits;

  // Every event submitted to segment
  private segmentApiCalls: SegmentApiCalls;

  constructor() {
    this.analytics = Analytics;
    this.store = new Store<MetricsState>({
      name: `mmd-desktop-metrics`,
    });

    this.desktopMetricsId = this.store.get('desktopMetricsId', '');
    this.eventsBeforeMetricsOptIn = this.store.get(
      'eventsBeforeMetricsOptIn',
      [],
    );
    this.traits = this.store.get('traits', {});
    this.segmentApiCalls = this.store.get('segmentApiCalls', {});
  }

  /* The track method lets you record the actions your users perform. */
  track(event: string, properties: Properties = {}) {
    log.debug('track event', event);
    if (!this.desktopMetricsId) {
      this.setDesktopMetricsId(uuid());
    }

    const eventToTrack = {
      event,
      userId: this.desktopMetricsId,
      properties: { ...properties, ...this.traits },
      context: this.buildContext(),
      messageId: uuid(),
    };

    const isParticipateInDesktopMetrics =
      this.checkParticipateInDesktopMetrics();
    if (isParticipateInDesktopMetrics === false) {
      return;
      // If the condition is true, it means that the user has not yet opt-in/opt-out on the metrics page
    } else if (isParticipateInDesktopMetrics === undefined) {
      this.eventsBeforeMetricsOptIn.push(eventToTrack);
      return;
    }

    this.analytics.track(eventToTrack);
    this.saveCallSegmentAPI(eventToTrack);
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  identify(traits: Traits) {
    log.debug('identify event', traits);
    if (this.checkParticipateInDesktopMetrics() === false) {
      return;
    }
    this.traits = { ...this.traits, ...traits };
    this.analytics.identify({
      userId: this.desktopMetricsId,
      traits: this.traits,
      context: this.buildContext(),
    });
  }

  setDesktopMetricsId(id: string) {
    this.desktopMetricsId = id;
    this.store.set('desktopMetricsId', id);
  }

  private checkParticipateInDesktopMetrics(): boolean | undefined {
    const desktopMetricsOptInValue = readPersistedSettingFromAppState({
      defaultValue: undefined,
      key: 'metametricsOptIn',
    });
    const desktopMetricsOptIn =
      typeof desktopMetricsOptInValue === 'string'
        ? desktopMetricsOptInValue === 'true'
        : desktopMetricsOptInValue;

    // Flush events saved before user opt-in
    if (desktopMetricsOptIn && this.eventsBeforeMetricsOptIn?.length > 0) {
      this.flushEventsBeforeOptIn();
    }
    return desktopMetricsOptIn;
  }

  private flushEventsBeforeOptIn() {
    log.debug('flushing events saved before user optIn');
    this.eventsBeforeMetricsOptIn?.forEach((event) => {
      this.analytics.track(event);
      this.saveCallSegmentAPI(event);
    });

    this.eventsBeforeMetricsOptIn = [];
  }

  private saveCallSegmentAPI(event: Event) {
    this.segmentApiCalls[uuid()] = event;
    this.store.set('segmentApiCalls', this.segmentApiCalls);
  }

  // Build the context object to attach to page and track events.
  private buildContext() {
    return {
      app: {
        name: app.name,
        version: getDesktopVersion(),
      },
    };
  }
}

export default new MetricsService();

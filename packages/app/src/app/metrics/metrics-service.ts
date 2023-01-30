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
import Analytics from './analytics';

class MetricsService {
  private store: Store<MetricsState>;

  private analytics: typeof Analytics;

  // TODO: Update participateInDesktopMetrics when user opt-in/opt-out on metrics UI
  private participateInDesktopMetrics = true;

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

    this.participateInDesktopMetrics = this.store.get(
      'participateInDesktopMetrics',
      true,
    );
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

    if (!this.participateInDesktopMetrics) {
      this.eventsBeforeMetricsOptIn.push(eventToTrack);
      return;
    }

    this.analytics.track(eventToTrack);
    this.saveCallSegmentAPI(eventToTrack);
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  identify(traits: Traits) {
    this.traits = { ...this.traits, ...traits };
    this.analytics.identify({
      userId: this.desktopMetricsId,
      traits: this.traits,
      context: this.buildContext(),
    });
  }

  setParticipateInDesktopMetrics(isParticipant: boolean) {
    this.participateInDesktopMetrics = isParticipant;
    this.store.set('participateInDesktopMetrics', isParticipant);

    if (isParticipant) {
      this.flushEventsBeforeOptIn();
    }
  }

  setDesktopMetricsId(id: string) {
    this.desktopMetricsId = id;
    this.store.set('desktopMetricsId', id);
  }

  // TODO: Implement flush events that are saved before users opt-in/opt-out
  flushEventsBeforeOptIn() {
    log.debug('No implementation provided');
  }

  saveCallSegmentAPI(event: Event) {
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

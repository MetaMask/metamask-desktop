import Store from 'electron-store';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import log from 'loglevel';
import { app } from 'electron';
import { getDesktopVersion } from '../../utils/version';
import Analytics from './analytics';

interface Traits {
  [key: string]: any;
}

interface Properties {
  paired?: boolean;
  createdAt?: Date;
  [key: string]: any;
}

interface Event {
  userId: string | undefined;
  event: string;
  properties: Properties;
  context: any;
  messageId?: string;
}

interface SegmentApiCalls {
  [key: string]: Event;
}

interface MetricsState {
  participateInDesktopMetrics: boolean;
  desktopMetricsId?: string;
  eventsBeforeMetricsOptIn: Event[];
  traits: Traits;
  segmentApiCalls: SegmentApiCalls;
}

class MetricsService {
  private store: Store<MetricsState>;

  private analytics: Analytics;

  // TODO: implement DesktopMetrics page the user to optIn/OptOut
  private participateInDesktopMetrics = true;

  private desktopMetricsId?: string;

  private eventsBeforeMetricsOptIn: Event[];

  // Traits are pieces of information you know about a user that are included in an identify call
  private traits: Traits;

  // Every event submitted to segment
  private segmentApiCalls: SegmentApiCalls;

  constructor() {
    this.analytics = Analytics.getInstance();
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

  identify(traits: Traits) {
    this.traits = { ...this.traits, ...traits };
    this.analytics.identify(this.desktopMetricsId, this.traits);
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
    this.store.set('metaMetricsId', id);
  }

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

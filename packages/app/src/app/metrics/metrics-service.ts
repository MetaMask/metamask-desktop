import Store from 'electron-store';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import log from 'loglevel';
import { app, ipcMain } from 'electron';
import { getDesktopVersion } from '../utils/version';
import {
  MetricsState,
  Properties,
  SegmentApiCalls,
  Traits,
  Event,
  FirstTimeEvents,
} from '../types/metrics';
import { readPersistedSettingFromAppState } from '../storage/ui-storage';
import Analytics from './analytics';
import { EVENT_NAMES, MetricsDecision } from './metrics-constants';

class MetricsService {
  private store: Store<MetricsState>;

  private analytics: typeof Analytics;

  // Unique identifier representing userId property on events
  private desktopMetricsId?: string;

  // Events saved before users opt-in/opt-out of metrics
  private eventsSavedBeforeMetricsDecision: Event[];

  // Traits are pieces of information you know about a user that are included in an identify call
  private traits: Traits;

  // Every event submitted to segment
  private segmentApiCalls: SegmentApiCalls;

  // Tracks first time events
  private firstTimeEvents: FirstTimeEvents;

  constructor() {
    this.analytics = Analytics;
    this.store = new Store<MetricsState>({
      name: `mmd-desktop-metrics`,
    });

    // Creates an object with all events and sets the value first-time event to true
    const defaultFirstTimeEvents: FirstTimeEvents = {};
    for (const event of Object.values(EVENT_NAMES)) {
      defaultFirstTimeEvents[event] = true;
    }

    this.firstTimeEvents = this.store.get(
      'firstTimeEvents',
      defaultFirstTimeEvents,
    );
    this.desktopMetricsId = this.store.get('desktopMetricsId', '');
    this.eventsSavedBeforeMetricsDecision = this.store.get(
      'eventsSavedBeforeMetricsDecision',
      [],
    );
    this.traits = this.store.get('traits', {});
    this.segmentApiCalls = this.store.get('segmentApiCalls', {});

    this.registerMetricsBridgeHandler();
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

    this.checkAndUpdateFirstTimeEvent(eventToTrack.event);

    log.debug('track event', eventToTrack);

    const metricsDecision = this.getMetricsDecision();
    if (metricsDecision === MetricsDecision.DISABLED) {
      return;
    } else if (metricsDecision === MetricsDecision.PENDING) {
      this.eventsSavedBeforeMetricsDecision.push(eventToTrack);
      return;
    }

    this.analytics.track(eventToTrack);
    this.saveCallSegmentAPI(eventToTrack);
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  identify(traits: Traits) {
    log.debug('identify event', traits);
    if (this.getMetricsDecision() === MetricsDecision.DISABLED) {
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

  private getMetricsDecision(): MetricsDecision {
    const desktopMetricsOptIn = readPersistedSettingFromAppState({
      defaultValue: undefined,
      key: 'metametricsOptIn',
    });

    if (desktopMetricsOptIn) {
      // Flush events saved before user opt-in
      if (this.eventsSavedBeforeMetricsDecision?.length > 0) {
        this.sendPendingEvents();
      }
      return MetricsDecision.ENABLED;
    } else if (desktopMetricsOptIn === false) {
      if (this.eventsSavedBeforeMetricsDecision?.length > 0) {
        this.cleanPendingEvents();
      }
      return MetricsDecision.DISABLED;
    }
    return MetricsDecision.PENDING;
  }

  private sendPendingEvents() {
    log.debug('sending events saved before user optIn');
    this.eventsSavedBeforeMetricsDecision?.forEach((event) => {
      this.analytics.track(event);
      this.saveCallSegmentAPI(event);
    });

    this.cleanPendingEvents();
  }

  private cleanPendingEvents() {
    this.eventsSavedBeforeMetricsDecision = [];
    this.store.set('eventsSavedBeforeMetricsDecision', []);
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

  private checkAndUpdateFirstTimeEvent(eventName: string) {
    if (!this.firstTimeEvents[eventName]) {
      return;
    }
    this.firstTimeEvents[eventName] = false;

    this.store.set('firstTimeEvents', this.firstTimeEvents);
  }

  private registerMetricsBridgeHandler() {
    ipcMain.handle(
      'analytics-track',
      (_event, eventName: string, properties: Properties) => {
        this.track(eventName, properties);
      },
    );

    ipcMain.handle('analytics-identify', (_event, traits: Traits) => {
      this.identify(traits);
    });
  }
}

export default new MetricsService();

import Store from 'electron-store';
import { uuid } from '@metamask/desktop/dist/utils/utils';
import log from 'loglevel';
import { app, ipcMain } from 'electron';
import { getDesktopVersion } from '../utils/version';
import {
  MetricsStorage,
  Properties,
  Traits,
  Event,
  EventsStorage,
} from '../types/metrics';
import { readPersistedSettingFromAppState } from '../storage/ui-storage';
import Analytics from './analytics';
import { MetricsDecision } from './metrics-constants';

class MetricsService {
  private store: Store<MetricsStorage>;

  private eventStore: Store<EventsStorage>;

  private analytics: typeof Analytics;

  // Unique identifier representing userId property on events
  private desktopMetricsId?: string;

  // Events saved before users opt-in/opt-out of metrics
  private eventsSavedBeforeMetricsDecision: Event[];

  // Traits are pieces of information you know about a user that are included in an identify call
  private traits: Traits;

  // Tracks first time events
  private processedEvents: string[];

  constructor() {
    this.analytics = Analytics;

    this.store = new Store<MetricsStorage>({
      name: `mmd-desktop-metrics`,
    });

    this.desktopMetricsId = this.store.get('desktopMetricsId', '');
    this.eventsSavedBeforeMetricsDecision = this.store.get(
      'eventsSavedBeforeMetricsDecision',
      [],
    );
    this.traits = this.store.get('traits', {});

    this.eventStore = new Store<EventsStorage>({
      name: `mmd-desktop-metrics-events`,
    });

    this.processedEvents = this.eventStore.get('processedEvents', []);

    this.registerMetricsBridgeHandler();
  }

  /* The track method lets you record the actions your users perform. */
  track(event: string, properties: Properties = {}) {
    const metricsDecision = this.getMetricsDecision();
    if (metricsDecision === MetricsDecision.DISABLED) {
      return;
    }

    if (!this.desktopMetricsId) {
      this.setDesktopMetricsId(uuid());
    }

    const eventToTrack = {
      event,
      userId: this.desktopMetricsId,
      properties: {
        ...properties,
        firstTimeEvent: !this.processedEvents.includes(event),
        ...this.traits,
      },
      context: this.buildContext(),
      messageId: uuid(),
    };

    this.saveProcessedEvents(eventToTrack.event);

    log.debug('track event', eventToTrack);

    if (metricsDecision === MetricsDecision.PENDING) {
      this.eventsSavedBeforeMetricsDecision.push(eventToTrack);
      this.store.set(
        'eventsSavedBeforeMetricsDecision',
        this.eventsSavedBeforeMetricsDecision,
      );
      return;
    }

    this.analytics.track(eventToTrack);
  }

  /* The identify method lets you tie a user to their actions and record
       traits about them. */
  identify(traits: Traits) {
    log.debug('identify event', traits);
    this.traits = { ...this.traits, ...traits };
    this.store.set('traits', this.traits);

    if (this.getMetricsDecision() === MetricsDecision.DISABLED) {
      return;
    }

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
    const defaultValue = undefined;
    const desktopMetricsOptIn = readPersistedSettingFromAppState({
      defaultValue,
      key: 'metametricsOptIn',
    });

    if (desktopMetricsOptIn === defaultValue) {
      return MetricsDecision.PENDING;
    }
    return desktopMetricsOptIn
      ? MetricsDecision.ENABLED
      : MetricsDecision.DISABLED;
  }

  private sendPendingEvents() {
    log.debug('sending events saved before user optIn');
    this.eventsSavedBeforeMetricsDecision?.forEach((event) => {
      this.analytics.track(event);
    });
  }

  private cleanPendingEvents() {
    this.eventsSavedBeforeMetricsDecision = [];
    this.store.set('eventsSavedBeforeMetricsDecision', []);
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

  private saveProcessedEvents(eventName: string) {
    if (this.processedEvents.includes(eventName)) {
      return;
    }
    this.processedEvents.push(eventName);

    this.eventStore.set('processedEvents', this.processedEvents);
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

    ipcMain.handle(
      'analytics-pending-events-handler',
      (_event, metricsDecision: boolean) => {
        if (metricsDecision) {
          this.sendPendingEvents();
        }
        this.cleanPendingEvents();
      },
    );
  }
}

export default new MetricsService();

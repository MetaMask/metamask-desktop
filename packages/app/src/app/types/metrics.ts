export interface Identity {
    userId?: string | number;
    anonymousId?: string | number;
  }

export interface Traits {
  [key: string]: any;
}

export interface EventsStorage {
  firstTimeEvents: string[];
}

export interface Properties {
  paired?: boolean;
  createdAt?: Date;
  [key: string]: any;
}

export interface Event {
  userId: string | undefined;
  event: string;
  properties: Properties;
  context: any;
  messageId?: string;
}

export interface MetricsStorage {
  desktopMetricsId?: string;
  eventsSavedBeforeMetricsDecision: Event[];
  traits: Traits;
}
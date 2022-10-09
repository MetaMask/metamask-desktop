import EventEmitter from 'events';

export const bubbleEvents = (
  original: EventEmitter,
  repeater: EventEmitter,
  events: string[],
) => {
  for (const event of events) {
    original.on(event, (data: any) => {
      repeater.emit(event, data);
    });
  }
};

export const onceAny = (
  targets: [emitter: EventEmitter, event: string][],
  listener: (data: any) => void,
) => {
  let handled = false;

  const handledListener = (data: any) => {
    if (handled) {
      return;
    }

    listener(data);

    handled = true;

    for (const target of targets) {
      target[0].removeListener(target[1], handledListener);
    }
  };

  for (const target of targets) {
    target[0].on(target[1], handledListener);
  }
};

export class RecordingEventEmitter {
  private target: EventEmitter;

  private listeners: { event: string; callback: (...args: any[]) => any }[];

  constructor(target: EventEmitter) {
    this.target = target;
    this.listeners = [];
  }

  public on(event: string, listener: (...args: any[]) => any) {
    this.target.on(event, listener);
    this.listeners.push({ event, callback: listener });
  }

  public remove() {
    for (const listener of this.listeners) {
      this.target.removeListener(listener.event, listener.callback);
    }
  }
}

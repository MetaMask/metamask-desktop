import { JSDOM } from 'jsdom';

const jsdom = new JSDOM();
global.window = jsdom.window as any;
global.self = window;
global.document = window.document;
global.navigator = window.navigator;
global.Element = window.Element;
global.HTMLElement = window.HTMLElement;

global.setImmediate =
  global.setImmediate ||
  ((fn: any, ...args: any[]) => global.setTimeout(fn, 0, ...args));

global.clearImmediate =
  global.clearImmediate || ((id: any) => global.clearTimeout(id));

if (!window.crypto) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.crypto = {} as any;
}

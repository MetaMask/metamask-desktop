import { JSDOM } from "jsdom";

const jsdom = new JSDOM();
global.window = jsdom.window as any;
global.self = window;
global.document = window.document;
global.navigator = window.navigator;
global.Element = window.Element;
global.HTMLElement = window.HTMLElement;

global.setImmediate =
  global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate =
  global.clearImmediate || ((id) => global.clearTimeout(id));

if (!window.crypto) {
  window.crypto = {} as any;
}

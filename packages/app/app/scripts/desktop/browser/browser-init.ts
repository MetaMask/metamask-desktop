import { initBrowser } from '@metamask/desktop/dist/browser';
import { browser } from './node-browser';

initBrowser({ initialBrowser: browser });

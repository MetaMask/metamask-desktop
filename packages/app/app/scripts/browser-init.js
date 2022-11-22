import browser from 'webextension-polyfill';
import { initBrowser } from '@metamask/desktop/dist/browser';

initBrowser({ initialBrowser: browser });

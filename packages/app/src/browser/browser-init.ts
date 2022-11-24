import { initBrowser } from '@metamask/desktop/dist/browser';
import { browser } from './node-browser';

console.log('SETTING NODE BROWSER');
initBrowser({ initialBrowser: browser });

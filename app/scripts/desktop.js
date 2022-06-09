import { initialize } from './generic-background';
import { DesktopStore } from './lib/desktop-store';

const localStore = new DesktopStore();
const browser = null; // @todo Proxy actions towards extension 
const notificationManager = null; // @todo Figure out where this should live

initialize({ localStore, triggerUi, browser, notificationManager }).catch(log.error);

function triggerUi () {
    // @todo Proxy towards extension
}

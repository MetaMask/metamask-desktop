import { initialize } from './generic-background';
import { DesktopStore } from './lib/desktop-store';

const localStore = new DesktopStore();

initialize({ localStore }).catch(log.error);


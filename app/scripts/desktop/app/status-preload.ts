import { ipcRenderer } from 'electron';
import { getVersion } from '../utils/version';

window["mmd-version"] = getVersion();

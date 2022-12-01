import log from 'loglevel';
import { cfg } from './config';

log.setDefaultLevel(cfg().isDebug ? 'debug' : 'info');

export default log;

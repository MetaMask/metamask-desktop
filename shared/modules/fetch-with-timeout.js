import { memoize } from 'lodash';
import { SECOND } from '../constants/time';
import fetch from 'node-fetch';

const getFetchWithTimeout = memoize((timeout = SECOND * 30) => {
  if (!Number.isInteger(timeout) || timeout < 1) {
    throw new Error('Must specify positive integer timeout.');
  }

  return async function _fetch(url, opts) {
    const abortController = new AbortController();
    const { signal } = abortController;
    const f = fetch(url, {
      ...opts,
      signal,
    });

    const timer = setTimeout(() => abortController.abort(), timeout);

    try {
      const res = await f;
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };
});

export default getFetchWithTimeout;

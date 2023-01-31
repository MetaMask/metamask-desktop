import { updatePairStatus } from '../ducks/pair-status/pair-status';

/**
 *
 * @param store
 */
export default function registerUpdatePairStatus(store) {
  return (statusData) => {
    store.dispatch(updatePairStatus(statusData));
  };
}

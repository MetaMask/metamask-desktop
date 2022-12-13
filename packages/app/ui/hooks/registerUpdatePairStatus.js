import { updatePairStatus } from '../ducks/pair-status/pair-status';

export default function registerUpdatePairStatus(store) {
  return (statusData) => {
    store.dispatch(updatePairStatus(statusData));
  };
}

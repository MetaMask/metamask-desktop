import { updatePairStatus } from '../ducks/pair-status/pair-status';

export default function registerUpdatePairStatus(store) {
  return (_, StatusData) => {
    store.dispatch(updatePairStatus(StatusData));
  };
}

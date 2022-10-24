import { updatePairStatus } from '../ducks/pair-status/pair-status';

export default function registerUpdatePairStatus(store) {
  return (_, StatusData) => {
    console.log('StatusData', StatusData);
    store.dispatch(updatePairStatus(StatusData));
  };
}

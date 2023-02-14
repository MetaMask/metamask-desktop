import { updateWindowSize } from '../ducks/app/app';

export default function registerResizedEvent(store) {
  return (size) => {
    store.dispatch(updateWindowSize(size));
  };
}

import { updateWindowPosition } from '../ducks/app/app';

export default function registerMovedEvent(store) {
  return (position) => {
    store.dispatch(updateWindowPosition(position));
  };
}

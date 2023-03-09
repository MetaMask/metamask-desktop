# UI Architecture

## Styling
In order to keep the styling consistent with extension styling approach, we use scss modules. This allows us to use the same variables and mixins as the extension. 
MetaMask Desktop styles are combined under `packages/app/src/ui/css/index.scss`. This file imports all the other components scss files which are used in the MM Desktop app.

## Application State Management
MetaMask Desktop UI state is managed by Redux. All the redux actions, reducers and selectors are under `packages/app/src/ui/ducks/` directory.

### Persisting UI State
Partial Redux state is being persisted using `redux-persist` library. In order to see what is being persisted, see root reducer in `packages/app/src/ui/ducks/index.js`.

### UI State Migration
Persisted UI states might need to be migrated when the state structure changes. In order to do that, persisted reducers need to be migrated into latest state structure. This is done by `redux-persist` library. 

To create new migration for a persisted reducer,

1. Increment the version number of persisted reducer in `packages/app/src/ui/ducks/index.js` file .
2. Create a new migration file under `packages/app/src/ui/migrations/<reducer_name>` directory with the name `m<version_number>.js`.
3. Export a function that takes the persisted state and returns the migrated state.

This migration will be automatically picked up by `redux-persist` library when the persisted state is loaded.


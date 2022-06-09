import Store from 'electron-store';

const STORE_KEY = 'main';

/**
 * A wrapper around electron-store that matches the other store wrappers
 */
export class DesktopStore {
    _store;

    constructor() {
        this._store = new Store();
        this.isSupported = true;
    }

    /**
     * Returns all of the keys currently saved
     *
     * @returns {Promise<*>}
     */
    async get() {
        if (!this.isSupported) {
            return undefined;
        }
        const result = await this._get();
        // extension.storage.local always returns an obj
        // if the object is empty, treat it as undefined
        if (isEmpty(result)) {
            return undefined;
        }
        return result;
    }

    /**
     * Sets the key in local state
     *
     * @param {Object} state - The state to set
     * @returns {Promise<void>}
     */
    async set(state) {
        return this._set(state);
    }

    /**
     * Returns all of the keys currently saved
     *
     * @private
     * @returns {Object} the key-value map from local storage
     */
    _get() {
        // @todo Wrap in promise?
        return this._store.get(STORE_KEY);
    }

    /**
     * Sets the key in local state
     *
     * @param {Object} obj - The key to set
     * @returns {Promise<void>}
     * @private
     */
    _set(obj) {
        // @todo Wrap in promise?
        this._store.set(STORE_KEY, obj);
    }
}

/**
 * Returns whether or not the given object contains no keys
 *
 * @param {Object} obj - The object to check
 * @returns {boolean}
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

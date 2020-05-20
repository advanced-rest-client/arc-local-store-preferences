import { LitElement } from 'lit-element';
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

/**
 * Creates a JSON wrapper for storage value. This ensures data types when
 * restorring values from local storage
 * @param {string} value Restored value
 * @return {any} Previously stored value.
 */
export function wrap(value) {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }
  return JSON.stringify({
    value,
  });
}

/**
 * Unwraps value from local storage data.
 *
 * @param {string} value Read value
 * @return {object|any[]} originally stored value.
 */
export function unwrap(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  try {
    const data = JSON.parse(value);
    return data.value;
  } catch (_) {
    return undefined;
  }
}

/**
 * `arc-local-store-preferences`
 *
 * An element that works with local storage to store ARC preferences.
 *
 * It can be used by any application. Remember to change `dataPrefix` to something
 * unique to your application.
 *
 * Keys are a combination of prefix and passed `key`,
 * Values in local storage are wrapped into JS object with `value` property.
 * This ensures data type when restoring the value without guessing the type.
 *
 * To ensure compatibility with other storage methods in ARC this handles
 * all operations asynchronous.
 *
 * The element offers an event API by handling `settings-read` and
 * `settings-changed` custom events.
 * Both events must be cancelable in order to be handled.
 *
 * ## settings-read
 *
 * The detail object can contain optional `settings` property with array of
 * key names to return with the query.
 *
 * Example:
 *
 * ```javascript
 * const e = new CustomEvent('settings-changed', {
 *  detail: {
 *    settings: ['key1', 'key2']
 *  },
 *  bubbles: true,
 *  composed: true,
 *  cancelable: true
 * });
 * this.dispatchEvent(e);
 * if (e.defaultPrevented) {
 *  e.detail.result.then((data) => console.log(data));
 * }
 * ```
 *
 * ## settings-changed
 *
 * Example:
 *
 * ```javascript
 * const e = new CustomEvent('settings-changed', {
 *  detail: {
 *    name: 'my-key',
 *    value: true
 *  },
 *  bubbles: true,
 *  composed: true,
 *  cancelable: true
 * });
 * this.dispatchEvent(e);
 * if (e.defaultPrevented) {
 *  e.detail.result.then(() => console.log('Settings saved'));
 * }
 * ```
 *
 * @customElement
 * @memberof LogicElements
 */
export class ArcLocalStorePreferences extends LitElement {
  static get properties() {
    return {
      /**
       * Storage preference key prefix
       */
      dataPrefix: { type: String },
    };
  }

  constructor() {
    super();
    this.dataPrefix = '_arc_';
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
    this._winSettingsHandler = this._winSettingsHandler.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener('settings-read', this._readHandler);
    window.addEventListener('settings-changed', this._changeHandler);
    window.addEventListener('storage', this._winSettingsHandler);
    this.setAttribute('aria-hidden', 'true');
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    window.removeEventListener('settings-read', this._readHandler);
    window.removeEventListener('settings-changed', this._changeHandler);
    window.removeEventListener('storage', this._winSettingsHandler);
  }

  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `load()` function.
   *
   * @param {CustomEvent} e Custom event
   */
  _readHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.load(e.detail.settings);
  }

  /**
   * A handler for window `settings-changed` custom event.
   * Sends the intent to the main proces to update preferences.
   * @param {CustomEvent} e
   */
  _changeHandler(e) {
    if (!e.cancelable || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { name } = e.detail;
    if (!name) {
      e.detail.result = Promise.reject(new Error('Name is not set.'));
      return;
    }
    e.detail.result = this.store(name, e.detail.value);
  }

  /**
   * Loads all stored settings in the local storage
   * @param {string[]?} scope Optional list of key names to return.
   * @return {Promise<object>} A promise resolved to the settings object
   */
  async load(scope) {
    const { dataPrefix = '' } = this;
    const result = {};
    const prefix = `${dataPrefix}.`;
    const pLen = prefix.length;
    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) === 0) {
        const settingKey = key.substr(pLen);
        if (scope && scope.indexOf(settingKey) === -1) {
          continue;
        }
        const value = unwrap(localStorage.getItem(key));
        result[settingKey] = value;
      }
    }
    return result;
  }

  /**
   * Stores value in local store using `dataPrefix` to construct the key.
   * @param {string} key Setting name
   * @param {any} value A value to store
   * @return {Promise}
   */
  async store(key, value) {
    const prefix = this.dataPrefix || '';
    const sKey = `${prefix}.${key}`;
    localStorage.setItem(sKey, wrap(value));
    this._informChanged(key, value);
  }

  /**
   * Removes all stored preferences.
   * If `dataPrefix` is not set then it removes all items.
   */
  async clear() {
    const prefix = this.dataPrefix || '';
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) === 0) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Handler for the `storage` event. Dispateched when other window updated
   * value in the storage area.
   *
   * @param {StorageEvent} e
   */
  _winSettingsHandler(e) {
    if (e.storageArea !== 'local') {
      return;
    }
    const { key } = e;
    const value = e.newValue;
    this._informChanged(key, value);
  }

  /**
   * Dispatches non cancelable `settings-changed` event with changed value.
   * @param {string} name Setting key
   * @param {any} value Setting value
   */
  _informChanged(name, value) {
    const e = new CustomEvent('settings-changed', {
      detail: {
        name,
        value,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(e);
  }
}

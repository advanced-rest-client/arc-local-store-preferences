import {PolymerElement} from '../../@polymer/polymer/polymer-element.js';
/**
 * `arc-local-store-workspace`
 *
 * An element that works with local storage to store ARC workspace data.
 *
 * @customElement
 * @polymer
 * @memberof LogicElements
 */
class ArcLocalStoreWorkspace extends PolymerElement {
  static get properties() {
    return {
      /**
       * Storage preference key prefix
       */
      prefix: {
        type: String,
        value: '_arcworkspace'
      }
    };
  }
  constructor() {
    super();
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('workspace-state-read', this._readHandler);
    window.addEventListener('workspace-state-store', this._changeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('workspace-state-read', this._readHandler);
    window.removeEventListener('workspace-state-store', this._changeHandler);
  }
  /**
   * Handler for the `workspace-state-read` custom event. Reads current
   * state of the ARC workspace.
   *
   * @param {CustomEvent} e Custom event
   */
  _readHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.load();
  }
  /**
   * Handler for the `workspace-state-store` custom event. Saves current
   * state of the ARC workspace.
   * @param {CustomEvent} e
   */
  _changeHandler(e) {
    if (!e.cancelable || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const value = e.detail.value;
    if (!value) {
      e.detail.result = Promise.reject(new Error('Value is not set.'));
      return;
    }
    this.store(value);
  }
  /**
   * Loads all stored workspace data
   * @return {Promise} A promise resolved to the worspace data object
   */
  load() {
    const result = {};
    const prefix = (this.dataPrefix || '') + '.';
    const pLen = prefix.length;
    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) === 0) {
        const settingKey = key.substr(pLen);
        const value = this._unwrap(localStorage.getItem(key));
        result[settingKey] = value;
      }
    }
    return Promise.resolve(result);
  }
  /**
   * Stores value in local store using `prefix` to construct the key.
   * The operation is debounced for 500 ms. Each call will clear the debouncer
   * and start over.
   * @param {any} value A value to store
   */
  store(value) {
    this.__pendingWorkspace = value;
    if (this.__workspaceWriteDebounce) {
      clearTimeout(this.__workspaceWriteDebounce);
    }
    this.__workspaceWriteDebounce = setTimeout(() => {
      this.__workspaceWriteDebounce = undefined;
      this._store(this.__pendingWorkspace);
      this.__pendingWorkspace = undefined;
    }, 500);
  }

  _store(workspace) {
    if (!workspace) {
      return;
    }
    Object.keys(workspace).forEach((key) => {
      const prefix = this.dataPrefix || '';
      const sKey = `${prefix}.${key}`;
      const value = workspace[key];
      try {
        localStorage.setItem(sKey, this._wrap(value));
      } catch (e) {
        console.warn(e);
      }
    });
  }
  /**
   * Removes all stored workspace data.
   */
  clear() {
    const prefix = this.dataPrefix;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) === 0) {
        localStorage.removeItem(key);
      }
    }
  }
  /**
   * Creates a JSON wrapper for storage value. This ensures data types when
   * restorring values from local storage
   * @param {String} value Restored value
   * @return {any} Previously stored value.
   */
  _wrap(value) {
    if (typeof value === 'undefined' || value === null) {
      return value;
    }
    return JSON.stringify({
      value
    });
  }
  /**
   * Unwraps value from local storage data.
   * @param {String} value Read value
   * @return {any} originally stored value.
   */
  _unwrap(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }
    try {
      value = JSON.parse(value);
      return value.value;
    } catch (_) {}
  }
}
window.customElements.define('arc-local-store-workspace', ArcLocalStoreWorkspace);

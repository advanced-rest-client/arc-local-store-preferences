import { LitElement } from 'lit-element';
import { wrap, unwrap } from './ArcLocalStorePreferences.js';

/* eslint-disable no-plusplus */

/**
 * `arc-local-store-workspace`
 *
 * An element that works with local storage to store ARC workspace data.
 */
export class ArcLocalStoreWorkspace extends LitElement {
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
    this.dataPrefix = '_arcworkspace';
    this._readHandler = this._readHandler.bind(this);
    this._changeHandler = this._changeHandler.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener('workspace-state-read', this._readHandler);
    window.addEventListener('workspace-state-store', this._changeHandler);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
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
    const { value } = e.detail;
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
  async load() {
    const { dataPrefix = '' } = this;
    const result = {};
    const prefix = `${dataPrefix}.`;
    const pLen = prefix.length;
    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) === 0) {
        const settingKey = key.substr(pLen);
        const value = unwrap(localStorage.getItem(key));
        result[settingKey] = value;
      }
    }
    return result;
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
        localStorage.setItem(sKey, wrap(value));
      } catch (e) {
        // ..
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
}

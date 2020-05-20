import { LitElement } from 'lit-element';
/**
 * `arc-local-store-workspace`
 *
 * An element that works with local storage to store ARC workspace data.
 */
export class ArcLocalStoreWorkspace extends LitElement {

  /**
   * Storage preference key prefix
   */
  prefix: string|undefined;
  connectedCallback(): void;
  disconnectedCallback(): void;

  /**
   * Handler for the `workspace-state-read` custom event. Reads current
   * state of the ARC workspace.
   *
   * @param e Custom event
   */
  _readHandler(e: CustomEvent): void;

  /**
   * Handler for the `workspace-state-store` custom event. Saves current
   * state of the ARC workspace.
   */
  _changeHandler(e: CustomEvent): void;

  /**
   * Loads all stored workspace data
   *
   * @returns A promise resolved to the worspace data object
   */
  load(): Promise<object>;

  /**
   * Stores value in local store using `dataPrefix` to construct the key.
   * @param {string} key Setting name
   * @param  value A value to store
   */
  store(keystring: string, value: any): Promise<void>;

  /**
   * Removes all stored workspace data.
   */
  clear(): Promise<void>;

  /**
   * Handler for the `storage` event. Dispateched when other window updated
   * value in the storage area.
   */
  _winSettingsHandler(e: StorageEvent): void;

  /**
   * Dispatches non cancelable `settings-changed` event with changed value.
   * @param {string} name Setting key
   * @param {any} value Setting value
   */
  _informChanged(name: string, value: any): void;
}

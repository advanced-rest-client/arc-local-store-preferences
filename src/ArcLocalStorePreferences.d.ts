import { LitElement } from 'lit-element';
/**
 * Creates a JSON wrapper for storage value. This ensures data types when
 * restorring values from local storage
 * @param value Restored value
 * @returns Previously stored value.
 */
export declare function wrap(value: string): any;

/**
 * Unwraps value from local storage data.
 *
 * @param value Read value
 * @returns originally stored value.
 */
export function unwrap(value: string): object|any[];

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
 */
export class ArcLocalStorePreferences extends LitElement {

  /**
   * Storage preference key prefix
   */
  dataPrefix: string|null|undefined;
  connectedCallback(): void;
  disconnectedCallback(): void;

  /**
   * Handler for the `settings-read` custom event. Reads current settings.
   * It set's the `result` property on event's detail object with the
   * promise from calling `load()` function.
   *
   * @param e Custom event
   */
  _readHandler(e: CustomEvent): void;

  /**
   * A handler for window `settings-changed` custom event.
   * Sends the intent to the main proces to update preferences.
   */
  _changeHandler(e: CustomEvent): void;

  /**
   * Loads all stored settings in the local storage
   *
   * @param scope Optional list of key names to return.
   * @returns A promise resolved to the settings object
   */
  load(scope?: string[]): Promise<object>;

  /**
   * Stores value in local store using `dataPrefix` to construct the key.
   *
   * @param key Setting name
   * @param value A value to store
   */
  store(key: String, value: any): Promise<void>;

  /**
   * Removes all stored preferences.
   * If `dataPrefix` is not set then it removes all items.
   */
  clear(): Promise<void>;

  /**
   * Handler for the `storage` event. Dispateched when other window updated
   * value in the storage area.
   */
  _winSettingsHandler(e: StorageEvent|null): void;

  /**
   * Dispatches non cancelable `settings-changed` event with changed value.
   *
   * @param name Setting key
   * @param value Setting value
   */
  _informChanged(name: string, value: any): void;
}

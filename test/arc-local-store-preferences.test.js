import { fixture, assert } from '@open-wc/testing';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import '../arc-local-store-preferences.js';

describe('<arc-local-store-preferences>', function() {
  async function basicFixture() {
    return (await fixture(`<arc-local-store-preferences></arc-local-store-preferences>`));
  }

  describe('arc-local-store-preferences', () => {
    describe('Storing data', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      afterEach(async () => {
        await element.clear();
      });

      it('Stores data in the store', async () => {
        await element.store('key', true);
        const stored = localStorage['_arc_.key'];
        assert.equal(stored, '{"value":true}');
      });

      it('Dispatches settings-changed event', (done) => {
        const key = 'test-key';
        const value = 123;
        element.addEventListener('settings-changed', function f(e) {
          element.removeEventListener('settings-changed', f);
          assert.isFalse(e.cancelable);
          assert.equal(e.detail.name, key);
          assert.equal(e.detail.value, value);
          done();
        });
        element.store(key, value);
      });

      it('Stores data via event', async () => {
        const name = 'test-key-event';
        const value = 'abc';

        const e = new CustomEvent('settings-changed', {
          detail: {
            name,
            value
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);

        await e.detail.result;
        const stored = localStorage['_arc_.' + name];
        assert.equal(stored, '{"value":"abc"}');
      });
    });

    describe('Reading data', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
        localStorage['_arc_.a'] = JSON.stringify({ value: 'a' });
        localStorage['_arc_.b'] = JSON.stringify({ value: true });
        localStorage['_arc_.c'] = JSON.stringify({ value: 12 });
        localStorage['_arc_.d'] = JSON.stringify({ value: null });
      });

      afterEach(async () => {
        await element.clear();
      });

      it('Promise resolves to an object with all stored data', () => {
        return element.load()
        .then((data) => {
          assert.isDefined(data.a);
          assert.isDefined(data.b);
          assert.isDefined(data.c);
          assert.isDefined(data.d);
        });
      });

      it('Returns string value', () => {
        return element.load()
        .then((data) => {
          assert.strictEqual(data.a, 'a');
        });
      });

      it('Returns boolean value', () => {
        return element.load()
        .then((data) => {
          assert.strictEqual(data.b, true);
        });
      });

      it('Returns number value', () => {
        return element.load()
        .then((data) => {
          assert.strictEqual(data.c, 12);
        });
      });

      it('Returns null value', () => {
        return element.load()
        .then((data) => {
          assert.strictEqual(data.d, null);
        });
      });

      it('Returns scoped data', () => {
        return element.load(['a', 'c'])
        .then((data) => {
          assert.isDefined(data.a);
          assert.isUndefined(data.b);
          assert.isDefined(data.c);
          assert.isUndefined(data.d);
        });
      });

      it('Reads data via event', () => {
        const e = new CustomEvent('settings-read', {
          detail: {},
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);
        return e.detail.result.then((data) => {
          assert.strictEqual(data.a, 'a');
          assert.strictEqual(data.b, true);
          assert.strictEqual(data.c, 12);
          assert.strictEqual(data.d, null);
        });
      });

      it('Reads scoped data via event', () => {
        const e = new CustomEvent('settings-read', {
          detail: {
            settings: ['c', 'd']
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);
        return e.detail.result.then((data) => {
          assert.isUndefined(data.a);
          assert.isUndefined(data.b);
          assert.strictEqual(data.c, 12);
          assert.strictEqual(data.d, null);
        });
      });

      it('Ignores cancelled events', () => {
        const e = new CustomEvent('settings-read', {
          detail: {},
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.addEventListener('settings-read', function f(e) {
          document.body.removeEventListener('settings-read', f);
          e.preventDefault();
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe('_winSettingsHandler()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
        localStorage['_arc_.a'] = JSON.stringify({ value: 'a' });
        localStorage['_arc_.b'] = JSON.stringify({ value: true });
        localStorage['_arc_.c'] = JSON.stringify({ value: 12 });
        localStorage['_arc_.d'] = JSON.stringify({ value: null });
      });

      afterEach(async () => {
        element.clear();
      });

      it('Does nothing when storageArea is not "local"', () => {
        const spy = sinon.spy(element, '_informChanged');
        element._winSettingsHandler({
          storageArea: 'session'
        });
        assert.isFalse(spy.called);
      });

      it('Calls _informChanged with arguments', () => {
        const spy = sinon.spy(element, '_informChanged');
        element._winSettingsHandler({
          storageArea: 'local',
          key: 'test-key',
          newValue: 'test-value'
        });
        assert.isTrue(spy.called);
        assert.equal(spy.args[0][0], 'test-key');
        assert.equal(spy.args[0][1], 'test-value');
      });
    });

    describe('_wrap()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns undefined for undefined argument', () => {
        const result = element._wrap();
        assert.isUndefined(result);
      });

      it('Returns null for null argument', () => {
        const result = element._wrap(null);
        assert.equal(result, null);
      });

      it('Returns json string', () => {
        const result = element._wrap({ test: true });
        assert.equal(result, '{"value":{"test":true}}');
      });
    });

    describe('_unwrap()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns undefined for undefined argument', () => {
        const result = element._unwrap();
        assert.isUndefined(result);
      });

      it('Returns null for null argument', () => {
        const result = element._unwrap(null);
        assert.equal(result, null);
      });

      it('Returns object from "value"', () => {
        const result = element._unwrap('{"value":{"test":true}}');
        assert.deepEqual(result, { test: true });
      });

      it('Returns undefined for invalid json', () => {
        const result = element._unwrap('{"value"');
        assert.isUndefined(result);
      });
    });
  });
});

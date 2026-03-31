import * as assert from 'assert';
import { deactivate } from '../extension';

suite('Extension Lifecycle', () => {
  test('deactivate does not throw', () => {
    assert.doesNotThrow(() => deactivate());
  });
});

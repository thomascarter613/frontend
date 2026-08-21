import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessibilityContract, validateAccessibilityContract, moveRovingFocus, shouldReduceMotion } from '../src/platform/accessibility.js';

test('accessibility contracts carry role/name/keyboard/focus/announcement behavior', () => {
  const contract = createAccessibilityContract({ role: 'tab', name: 'Architecture', keyboard: ['Enter activates', 'Delete closes'], focus: 'roving', announcements: ['selected'] });
  assert.deepEqual(validateAccessibilityContract(contract), []);
});

test('roving focus supports arrows home and end', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(moveRovingFocus(ids, 'b', 'ArrowRight'), 'c');
  assert.equal(moveRovingFocus(ids, 'c', 'ArrowRight'), 'a');
  assert.equal(moveRovingFocus(ids, 'b', 'Home'), 'a');
  assert.equal(moveRovingFocus(ids, 'b', 'End'), 'c');
});

test('motion preference honors explicit and system reduced motion', () => {
  assert.equal(shouldReduceMotion('reduce', false), true);
  assert.equal(shouldReduceMotion('full', true), false);
  assert.equal(shouldReduceMotion('system', true), true);
});

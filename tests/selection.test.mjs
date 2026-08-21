import test from 'node:test';
import assert from 'node:assert/strict';
import { createSelection, isSelected, selectAllMatching, selectRange, selectSingle, selectionCount, toggleSelection } from '../src/platform/selection.js';

test('selection supports single, toggle, and range without conflating focus', () => {
  let selection = selectSingle('table:metrics', 'a');
  selection = toggleSelection(selection, 'c');
  assert.equal(selection.mode, 'multiple');
  assert.deepEqual(selection.ids.sort(), ['a', 'c']);
  selection = selectRange(createSelection({ scope: 'table:metrics', mode: 'single', ids: ['b'], anchorId: 'b' }), ['a', 'b', 'c', 'd'], 'd');
  assert.deepEqual(selection.ids, ['b', 'c', 'd']);
  assert.equal(isSelected(selection, 'c'), true);
});

test('all-matching selection remains symbolic for large result sets', () => {
  const selection = selectAllMatching('search:results', { query: 'status:open' }, ['row-3']);
  assert.equal(selection.mode, 'all-matching');
  assert.equal(selectionCount(selection, 1000), 999);
  assert.equal(isSelected(selection, 'row-3'), false);
});

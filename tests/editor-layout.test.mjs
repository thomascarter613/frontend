import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectGroupIds,
  createInitialEditorLayout,
  findSplit,
  removeGroup,
  setSplitRatio,
  splitGroup,
} from '../src/platform/editor-layout.js';
import { createInitialState, reducer } from '../src/platform/state.js';

test('editor layout is a recursive split tree', () => {
  const layout = createInitialEditorLayout();
  assert.equal(layout.type, 'split');
  assert.deepEqual(collectGroupIds(layout), ['group-a', 'group-b']);
});

test('splitting an editor group creates a third leaf without a custom layout type', () => {
  let state = createInitialState();
  state = reducer(state, { type: 'editor/split', groupId: 'group-b', newGroupId: 'group-c', orientation: 'horizontal' });
  assert.equal(state.editors.groups.length, 3);
  assert.deepEqual(collectGroupIds(state.editors.layout), ['group-a', 'group-b', 'group-c']);
  assert.equal(findSplit(state.editors.layout, 'split:group-b:group-c')?.orientation, 'horizontal');
});

test('split ratios are bounded and groups collapse when removed', () => {
  let layout = splitGroup(createInitialEditorLayout(), 'group-b', 'group-c');
  layout = setSplitRatio(layout, 'split:group-b:group-c', 0.95);
  assert.equal(findSplit(layout, 'split:group-b:group-c')?.ratio, 0.8);
  layout = removeGroup(layout, 'group-c');
  assert.deepEqual(collectGroupIds(layout), ['group-a', 'group-b']);
});

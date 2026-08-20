import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPreset, createInitialState, reducer } from '../src/platform/state.js';


test('maximum workspace opens with all major regions visible', () => {
  const state = createInitialState();
  assert.equal(state.workspace.sidebar, 'visible');
  assert.equal(state.workspace.inspector, 'visible');
  assert.equal(state.workspace.bottomPanel, 'visible');
  assert.equal(state.workspace.secondaryEditor, true);
  assert.equal(state.workspace.activityRail, true);
});

test('focus preset collapses secondary chrome without replacing editor state', () => {
  const state = createInitialState();
  const activeBefore = state.editors.groups[0].active;
  const next = applyPreset(state, 'focus');
  assert.equal(next.workspace.sidebar, 'hidden');
  assert.equal(next.workspace.inspector, 'hidden');
  assert.equal(next.workspace.bottomPanel, 'hidden');
  assert.equal(next.workspace.secondaryEditor, false);
  assert.equal(next.editors.groups[0].active, activeBefore);
});

test('moving a resource between editor groups preserves stable resource identity', () => {
  const state = createInitialState();
  const next = reducer(state, { type: 'editor/move', resourceId: 'document-architecture', fromGroupId: 'group-a', toGroupId: 'group-b' });
  assert.equal(next.editors.groups[0].tabs.includes('document-architecture'), false);
  assert.equal(next.editors.groups[1].tabs.includes('document-architecture'), true);
  assert.equal(next.selectedResourceId, 'document-architecture');
});

test('draft content survives workspace preset changes', () => {
  let state = createInitialState();
  state = reducer(state, { type: 'draft/update', resourceId: 'document-architecture', value: 'unsaved but preserved' });
  state = reducer(state, { type: 'workspace/applyPreset', preset: 'research' });
  assert.equal(state.drafts['document-architecture'], 'unsaved but preserved');
});

test('offline edits remain marked as local changes', () => {
  let state = createInitialState();
  state = reducer(state, { type: 'connection/set', online: false });
  state = reducer(state, { type: 'draft/update', resourceId: 'document-architecture', value: 'offline change' });
  assert.equal(state.connection.online, false);
  assert.equal(state.connection.sync, 'offline changes');
});

test('region sizes are serializable state, not theme tokens', () => {
  const state = reducer(createInitialState(), { type: 'workspace/setSize', key: 'sidebarWidth', value: 333 });
  assert.equal(state.workspace.sidebarWidth, 333);
  assert.equal(state.appearance.theme, 'dark');
});

test('legacy v1 editor state migrates into the recursive split layout', () => {
  const saved = {
    editors: {
      groups: [
        { id: 'group-a', tabs: ['document-architecture'], active: 'document-architecture' },
        { id: 'group-b', tabs: ['table-project-metrics'], active: 'table-project-metrics' },
      ],
      activeGroup: 'group-a',
    },
  };
  const state = createInitialState(saved);
  assert.equal(state.editors.layout.type, 'split');
  assert.equal(state.editors.layout.first.groupId, 'group-a');
  assert.equal(state.editors.layout.second.groupId, 'group-b');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoute, serializeRoute, parseRoute, shareableStateFromState, localWorkspaceStateFromState } from '../src/platform/routing.js';

test('route serialization preserves shareable resource/view/filter context', () => {
  const route = createRoute({ workspaceId: 'acme', resourceId: 'doc-1', viewId: 'view.document', filter: { status: 'Review' }, subview: 'comments' });
  const parsed = parseRoute(serializeRoute(route));
  assert.deepEqual(parsed, route);
});

test('shareable route excludes local workstation geometry', () => {
  const state = { navigation: { workspaceId: 'w1', viewId: 'view.table', filter: { owner: 'me' }, subview: null }, selectedResourceId: 'table-1', workspace: { sidebarWidth: 333, inspectorWidth: 400 }, editors: { groups: [] }, appearance: { theme: 'dark' } };
  const shareable = shareableStateFromState(state);
  assert.equal('workspace' in shareable, false);
  assert.equal(JSON.stringify(shareable).includes('sidebarWidth'), false);
  assert.equal(localWorkspaceStateFromState(state).workspace.sidebarWidth, 333);
});

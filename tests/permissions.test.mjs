import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPABILITIES, createCapabilityPolicy, hasCapability, withCapability } from '../src/platform/permissions.js';
import { createInitialState, reducer } from '../src/platform/state.js';
import { renderApp } from '../src/ui/templates.js';

test('permission evaluation is capability-based and explicit deny wins', () => {
  const policy = createCapabilityPolicy({ allow: ['*'], deny: [CAPABILITIES.RESOURCE_DELETE] });
  assert.equal(hasCapability(policy, CAPABILITIES.RESOURCE_READ), true);
  assert.equal(hasCapability(policy, CAPABILITIES.RESOURCE_DELETE), false);
});

test('revoking update capability preserves an existing draft', () => {
  let state = createInitialState();
  state = reducer(state, { type: 'draft/update', resourceId: 'document-architecture', value: 'preserve me' });
  state = reducer(state, { type: 'permissions/set', policy: withCapability(state.permissions, CAPABILITIES.RESOURCE_UPDATE, false) });
  assert.equal(state.drafts['document-architecture'], 'preserve me');
  assert.equal(hasCapability(state.permissions, CAPABILITIES.RESOURCE_UPDATE), false);
});

test('read-only rendering exposes permission state without replacing the resource surface', () => {
  let state = createInitialState();
  state = reducer(state, { type: 'permissions/set', policy: withCapability(state.permissions, CAPABILITIES.RESOURCE_UPDATE, false) });
  const html = renderApp(state);
  assert.match(html, /Read-only/);
  assert.match(html, /document-editor/);
  assert.match(html, /readonly/);
});

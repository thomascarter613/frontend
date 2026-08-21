import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMutation, safeRender, createLoadingBoundary, transitionLoadingBoundary } from '../src/platform/async-boundary.js';
import { createMemoryInstrumentation } from '../src/platform/instrumentation.js';

test('mutation utility performs optimistic-confirm flow', async () => {
  const steps = [];
  const result = await executeMutation({ optimistic: async () => { steps.push('optimistic'); return 'snapshot'; }, execute: async () => { steps.push('execute'); return 'server'; }, confirm: async (server, snapshot) => { steps.push(`confirm:${server}:${snapshot}`); } });
  assert.equal(result.status, 'success');
  assert.deepEqual(steps, ['optimistic', 'execute', 'confirm:server:snapshot']);
});

test('mutation utility rolls back failure and emits bounded instrumentation', async () => {
  const steps = [];
  const memory = createMemoryInstrumentation();
  const result = await executeMutation({ optimistic: () => { steps.push('optimistic'); return 'snapshot'; }, execute: () => { throw Object.assign(new Error('network down'), { category: 'network' }); }, rollback: (snapshot) => steps.push(`rollback:${snapshot}`), instrumentation: memory.instrumentation, eventName: 'resource.update' });
  assert.equal(result.status, 'failure');
  assert.deepEqual(steps, ['optimistic', 'rollback:snapshot']);
  assert.equal(memory.events.at(-1).name, 'resource.update.failure');
});

test('render failure is localized to its boundary', () => {
  const result = safeRender(() => { throw new Error('broken widget'); }, () => '<fallback>', { scope: 'widget' });
  assert.equal(result.ok, false);
  assert.equal(result.value, '<fallback>');
  assert.equal(result.scope, 'widget');
});

test('loading boundary transitions independently', () => {
  const initial = createLoadingBoundary({ id: 'editor.preview' });
  const loading = transitionLoadingBoundary(initial, 'loading');
  const ready = transitionLoadingBoundary(loading, 'ready');
  assert.equal(ready.state, 'ready');
});

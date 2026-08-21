import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstrumentation, createInstrumentationHub, createMemoryInstrumentation, sanitizeInstrumentationPayload } from '../src/platform/instrumentation.js';

test('instrumentation strips sensitive content-like fields', () => {
  const payload = sanitizeInstrumentationPayload({ resourceId: 'r1', draft: 'secret text', nested: { token: 'abc', viewId: 'v1' } });
  assert.deepEqual(payload, { resourceId: 'r1', nested: { viewId: 'v1' } });
});

test('instrumentation emits stable dotted event names without vendor coupling', () => {
  const memory = createMemoryInstrumentation();
  const event = memory.instrumentation.emit('command.executed', { commandId: 'workspace.toggleSidebar', body: 'do not capture' });
  assert.equal(event.name, 'command.executed');
  assert.deepEqual(event.payload, { commandId: 'workspace.toggleSidebar' });
  assert.equal(memory.events.length, 1);
});

test('invalid instrumentation names fail fast', () => {
  const instrumentation = createInstrumentation();
  assert.throws(() => instrumentation.emit('click', {}), /dotted stable identifiers/);
});

test('instrumentation hub keeps a bounded recent-event buffer', () => {
  const hub = createInstrumentationHub({ limit: 2, clock: () => 1 });
  hub.emit('command.executed', { commandId: 'a' });
  hub.emit('resource.opened', { resourceId: 'r1' });
  hub.emit('view.changed', { viewId: 'v1' });
  assert.deepEqual(hub.recent().map((event) => event.name), ['resource.opened', 'view.changed']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnosticsSnapshot, diagnosticText } from '../src/platform/diagnostics.js';
import { createPlatformError } from '../src/platform/errors.js';
import { createOperation } from '../src/platform/operations.js';
import { selectRecoveryItems } from '../src/platform/recovery.js';
import { createInitialState } from '../src/platform/state.js';

test('recovery center derives only unresolved recoverable work', () => {
  const state = createInitialState({ drafts: { 'document-architecture': 'recovered text' } });
  state.connection = { online: false, sync: 'offline changes' };
  state.jobs = [createOperation({ id: 'job-1', label: 'Import', state: 'failed', recoverable: true })];
  state.errors = [createPlatformError({ code: 'sync.retry', category: 'network', message: 'Sync failed', recoverable: true })];
  const items = selectRecoveryItems(state);
  assert.ok(items.some((item) => item.type === 'recovered-draft'));
  assert.ok(items.some((item) => item.type === 'unsynced-changes'));
  assert.ok(items.some((item) => item.type === 'job'));
  assert.ok(items.some((item) => item.type === 'error'));
});

test('diagnostics summarize workspace health without exposing raw state', () => {
  const state = createInitialState();
  state.connection = { online: false, sync: 'offline' };
  state.jobs = [createOperation({ id: 'job-2', label: 'Export', state: 'failed', recoverable: true })];
  const snapshot = createDiagnosticsSnapshot(state, { extensionCount: 2, contributionCount: 9 });
  assert.equal(snapshot.connectivity, 'Offline');
  assert.equal(snapshot.jobs.failed, 1);
  assert.equal(snapshot.extensions.installed, 2);
  assert.match(diagnosticText(snapshot), /Connectivity: Offline/);
});

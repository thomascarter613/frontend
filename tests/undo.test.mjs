import test from 'node:test';
import assert from 'node:assert/strict';
import { createUndoService } from '../src/platform/undo.js';

test('shared undo service applies inverse and redo actions', () => {
  const history = createUndoService({ limit: 5 });
  const dispatched = [];
  history.record({ label: 'Change theme', undoAction: { type: 'theme', value: 'dark' }, redoAction: { type: 'theme', value: 'light' } });
  assert.equal(history.canUndo(), true);
  assert.equal(history.undo((action) => dispatched.push(action)).label, 'Change theme');
  assert.deepEqual(dispatched.at(-1), { type: 'theme', value: 'dark' });
  assert.equal(history.canRedo(), true);
  history.redo((action) => dispatched.push(action));
  assert.deepEqual(dispatched.at(-1), { type: 'theme', value: 'light' });
});

test('merge keys collapse repeated reversible operations into one history entry', () => {
  const history = createUndoService();
  history.record({ label: 'Resize', mergeKey: 'sidebar', undoAction: { type: 'size', value: 270 }, redoAction: { type: 'size', value: 280 } });
  history.record({ label: 'Resize', mergeKey: 'sidebar', undoAction: { type: 'size', value: 270 }, redoAction: { type: 'size', value: 300 } });
  assert.equal(history.snapshot().past.length, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, createOperation, isTerminalOperation, transitionOperation } from '../src/platform/operations.js';

test('canonical operations enforce lifecycle transitions and retries', () => {
  let operation = createOperation({ id: 'export-1', label: 'Export', state: 'pending', recoverable: true });
  assert.equal(canTransition(operation, 'running'), true);
  operation = transitionOperation(operation, 'running', { progress: 10 });
  operation = transitionOperation(operation, 'failed');
  assert.equal(isTerminalOperation(operation), true);
  operation = transitionOperation(operation, 'retrying');
  assert.equal(operation.attempt, 1);
  operation = transitionOperation(operation, 'running');
  operation = transitionOperation(operation, 'success', { progress: 100 });
  assert.equal(operation.progress, 100);
  assert.equal(isTerminalOperation(operation), true);
});

test('invalid operation transitions fail loudly', () => {
  const operation = createOperation({ id: 'export-2', label: 'Export', state: 'pending' });
  assert.throws(() => transitionOperation(operation, 'success'), /Invalid operation transition/);
});

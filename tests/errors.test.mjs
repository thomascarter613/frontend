import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformError, err, ok } from '../src/platform/errors.js';

test('structured errors preserve category, recovery, resource, and operation context', () => {
  const error = createPlatformError({
    code: 'sync.conflict',
    category: 'conflict',
    message: 'The resource changed remotely.',
    recoverable: true,
    resourceId: 'document-architecture',
    operationId: 'save-42',
  });
  assert.equal(error.category, 'conflict');
  assert.equal(error.recoverable, true);
  assert.equal(error.resourceId, 'document-architecture');
  assert.equal(err(error).ok, false);
  assert.equal(ok('saved').value, 'saved');
});

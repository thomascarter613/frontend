import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotification, createActivityEvent, unreadNotificationCount } from '../src/platform/events.js';
import { createSyncMutation, createSyncConflict, updateMutationState, resolveConflict } from '../src/platform/sync.js';

test('notifications and activity events remain distinct models', () => {
  const notification = createNotification({ id: 'n1', title: 'Export complete', resourceId: 'r1' });
  const activity = createActivityEvent({ id: 'a1', type: 'job.completed', resourceId: 'r1', summary: 'Export completed' });
  assert.equal(notification.read, false);
  assert.equal('summary' in notification, false);
  assert.equal(activity.summary, 'Export completed');
  assert.equal('read' in activity, false);
  assert.equal(unreadNotificationCount([notification]), 1);
});

test('offline mutations support retry lifecycle and conflict resolution', () => {
  const mutation = createSyncMutation({ id: 'm1', resourceId: 'r1', payload: { status: 'Review' } });
  const retrying = updateMutationState(mutation, 'retrying');
  assert.equal(retrying.attempt, 1);
  const conflict = createSyncConflict({ id: 'c1', resourceId: 'r1', local: 'local', remote: 'remote', base: 'base' });
  const resolved = resolveConflict(conflict, 'local');
  assert.equal(resolved.state, 'resolved');
  assert.equal(resolved.value, 'local');
});

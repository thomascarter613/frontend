export function selectRecoveryItems(state) {
  const items = [];
  const recoveredDraftIds = state.recovery?.recoveredDraftIds ?? [];
  for (const resourceId of recoveredDraftIds) {
    items.push({ id: `draft:${resourceId}`, type: 'recovered-draft', resourceId, title: 'Recovered Draft', recoverable: true });
  }
  if (state.connection.sync !== 'synced' && Object.keys(state.drafts).length) {
    items.push({ id: 'sync:unsynced', type: 'unsynced-changes', title: 'Unsynced Changes', detail: state.connection.sync, recoverable: true });
  }
  for (const job of state.jobs) {
    if (['failed', 'interrupted', 'partial-success', 'waiting-connection'].includes(job.state)) {
      items.push({ id: `job:${job.id}`, type: 'job', title: job.label ?? job.title ?? 'Background Job', detail: job.state, jobId: job.id, recoverable: job.recoverable !== false });
    }
  }
  for (const mutation of state.syncQueue ?? []) {
    if (!['success', 'cancelled'].includes(mutation.state)) items.push({ id: `mutation:${mutation.id}`, type: 'pending-sync', title: 'Pending Sync', detail: mutation.resourceId, mutationId: mutation.id, recoverable: true });
  }
  for (const error of state.errors) {
    if (error.recoverable) items.push({ id: `error:${error.code}:${error.timestamp}`, type: 'error', title: error.message, detail: error.category, errorCode: error.code, recoverable: true });
  }
  for (const conflict of state.conflicts ?? []) {
    if (conflict.state !== 'resolved') items.push({ id: `conflict:${conflict.id}`, type: 'sync-conflict', title: 'Sync Conflict', detail: conflict.resourceId, conflictId: conflict.id, recoverable: true });
  }
  return items;
}

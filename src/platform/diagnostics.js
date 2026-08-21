import { selectRecoveryItems } from './recovery.js';

export function createDiagnosticsSnapshot(state, { extensionCount = 0, contributionCount = 0 } = {}) {
  const failedJobs = state.jobs.filter((job) => ['failed', 'interrupted', 'partial-success'].includes(job.state));
  const recovery = selectRecoveryItems(state);
  return Object.freeze({
    application: state.errors.some((error) => !error.recoverable) ? 'Needs attention' : 'Healthy',
    connectivity: state.connection.online ? (state.connection.sync === 'synced' ? 'Healthy' : 'Synchronizing') : 'Offline',
    syncIssues: recovery.filter((item) => item.type === 'unsynced-changes').length,
    jobs: { total: state.jobs.length, running: state.jobs.filter((job) => ['running', 'queued', 'retrying'].includes(job.state)).length, failed: failedJobs.length },
    extensions: { installed: extensionCount, contributions: contributionCount, status: 'Healthy' },
    workspace: { preset: state.workspace.preset, editorGroups: state.editors.groups.length },
    recentErrors: state.errors.slice(-5).map((error) => ({ code: error.code, category: error.category, message: error.message, recoverable: error.recoverable, timestamp: error.timestamp })),
    recoveryItems: recovery.length,
  });
}

export function diagnosticText(snapshot) {
  return [
    `Application: ${snapshot.application}`,
    `Connectivity: ${snapshot.connectivity}`,
    `Sync issues: ${snapshot.syncIssues}`,
    `Jobs: ${snapshot.jobs.running} running / ${snapshot.jobs.failed} failed / ${snapshot.jobs.total} total`,
    `Extensions: ${snapshot.extensions.status} (${snapshot.extensions.installed} installed)`,
    `Workspace: ${snapshot.workspace.preset}, ${snapshot.workspace.editorGroups} editor groups`,
    `Recovery items: ${snapshot.recoveryItems}`,
  ].join('\n');
}

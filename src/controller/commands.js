import { getCommand } from '../platform/commands.js';
import { createPlatformError } from '../platform/errors.js';
import { CAPABILITIES, hasCapability, withCapability } from '../platform/permissions.js';
import { closeOverlay, openOverlay, recordReversible, retryFailedJobs, startExportJob, store, toast, undoService } from './context.js';

export function runCommand(commandId) {
  const command = getCommand(commandId);
  if (!command) return;
  const state = store.getState();
  if (command.capability && !hasCapability(state.permissions, command.capability)) {
    const error = createPlatformError({ code: 'command.permission_denied', category: 'permission', message: `Permission required: ${command.capability}`, recoverable: true });
    store.dispatch({ type: 'error/add', error });
    closeOverlay();
    toast('Command unavailable', error.message);
    return;
  }

  const actions = {
    'workspace.toggleSidebar': () => recordReversible({ label: 'Toggle Primary Sidebar', action: { type: 'workspace/toggle', region: 'sidebar' }, inverse: { type: 'workspace/toggle', region: 'sidebar' } }),
    'workspace.toggleInspector': () => recordReversible({ label: 'Toggle Inspector', action: { type: 'workspace/toggle', region: 'inspector' }, inverse: { type: 'workspace/toggle', region: 'inspector' } }),
    'workspace.toggleBottomPanel': () => recordReversible({ label: 'Toggle Bottom Panel', action: { type: 'workspace/toggle', region: 'bottomPanel' }, inverse: { type: 'workspace/toggle', region: 'bottomPanel' } }),
    'editor.splitRight': () => store.dispatch({ type: 'editor/split', orientation: 'vertical' }),
    'editor.splitDown': () => store.dispatch({ type: 'editor/split', orientation: 'horizontal' }),
    'editor.closeGroup': () => store.dispatch({ type: 'editor/closeGroup', groupId: state.editors.activeGroup }),
    'appearance.toggleTheme': () => recordReversible({ label: 'Change Theme', action: { type: 'appearance/theme', theme: state.appearance.theme === 'dark' ? 'light' : 'dark' }, inverse: { type: 'appearance/theme', theme: state.appearance.theme } }),
    'appearance.cycleDensity': () => {
      const order = ['compact', 'default', 'comfortable'];
      const next = order[(order.indexOf(state.appearance.density) + 1) % order.length];
      recordReversible({ label: 'Cycle Density', action: { type: 'appearance/density', density: next }, inverse: { type: 'appearance/density', density: state.appearance.density } });
    },
    'resource.openArchitecture': () => store.dispatch({ type: 'editor/open', resourceId: 'document-architecture' }),
    'jobs.startExport': startExportJob,
    'history.undo': () => { const entry = undoService.undo((action) => store.dispatch(action)); toast(entry ? `Undid ${entry.label}` : 'Nothing to undo'); },
    'history.redo': () => { const entry = undoService.redo((action) => store.dispatch(action)); toast(entry ? `Redid ${entry.label}` : 'Nothing to redo'); },
    'system.openRecovery': () => openOverlay({ type: 'recovery' }),
    'system.openDiagnostics': () => openOverlay({ type: 'diagnostics' }),
    'jobs.retryFailed': retryFailedJobs,
    'selection.clear': () => {
      const previous = state.selection;
      if (previous.mode !== 'none') recordReversible({ label: 'Clear Selection', action: { type: 'selection/clear', scope: previous.scope }, inverse: { type: 'selection/set', selection: previous } });
    },
    'connection.toggleOffline': () => store.dispatch({ type: 'connection/set', online: !state.connection.online }),
    'permissions.simulateReadOnly': () => {
      let policy = withCapability(state.permissions, CAPABILITIES.RESOURCE_UPDATE, false);
      policy = withCapability(policy, CAPABILITIES.RESOURCE_SHARE, false);
      recordReversible({ label: 'Simulate Read-only Permissions', action: { type: 'permissions/set', policy }, inverse: { type: 'permissions/set', policy: state.permissions } });
    },
    'permissions.restoreEditing': () => {
      let policy = withCapability(state.permissions, CAPABILITIES.RESOURCE_UPDATE, true);
      policy = withCapability(policy, CAPABILITIES.RESOURCE_SHARE, true);
      recordReversible({ label: 'Restore Editing Permissions', action: { type: 'permissions/set', policy }, inverse: { type: 'permissions/set', policy: state.permissions } });
    },
  };

  if (commandId.startsWith('workspace.preset.')) {
    recordReversible({ label: command.label, action: { type: 'workspace/applyPreset', preset: commandId.split('.').at(-1) }, inverse: { type: 'workspace/restore', workspace: { ...state.workspace } } });
  } else actions[commandId]?.();

  if (store.getState().overlay && !['system.openRecovery', 'system.openDiagnostics'].includes(commandId)) closeOverlay();
  if (!['history.undo', 'history.redo'].includes(commandId)) toast(command.label);
}

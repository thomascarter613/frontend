export const COMMANDS = Object.freeze([
  { id: 'workspace.toggleSidebar', label: 'Toggle Primary Sidebar', shortcut: 'Ctrl/Cmd+B', capability: 'workspace.configure' },
  { id: 'workspace.toggleInspector', label: 'Toggle Inspector', shortcut: 'Ctrl/Cmd+Alt+I', capability: 'workspace.configure' },
  { id: 'workspace.toggleBottomPanel', label: 'Toggle Bottom Panel', shortcut: 'Ctrl/Cmd+J', capability: 'workspace.configure' },
  { id: 'editor.splitRight', label: 'Split Editor Right', shortcut: 'Ctrl/Cmd+\\', capability: 'editor.split' },
  { id: 'editor.splitDown', label: 'Split Editor Down', capability: 'editor.split' },
  { id: 'editor.closeGroup', label: 'Close Active Editor Group', capability: 'editor.split' },
  { id: 'workspace.preset.maximum', label: 'Workspace: Maximum', capability: 'workspace.configure' },
  { id: 'workspace.preset.focus', label: 'Workspace: Focus', capability: 'workspace.configure' },
  { id: 'workspace.preset.research', label: 'Workspace: Research', capability: 'workspace.configure' },
  { id: 'workspace.preset.development', label: 'Workspace: Development', capability: 'workspace.configure' },
  { id: 'workspace.preset.review', label: 'Workspace: Review', capability: 'workspace.configure' },
  { id: 'workspace.preset.zen', label: 'Workspace: Zen', capability: 'workspace.configure' },
  { id: 'appearance.toggleTheme', label: 'Change Theme', shortcut: 'Ctrl/Cmd+Shift+L' },
  { id: 'appearance.cycleDensity', label: 'Cycle Density' },
  { id: 'resource.openArchitecture', label: 'Open Architecture', capability: 'resource.read' },
  { id: 'jobs.startExport', label: 'Start Project Export', capability: 'job.start' },
  { id: 'connection.toggleOffline', label: 'Toggle Offline Simulation' },
  { id: 'permissions.simulateReadOnly', label: 'Permissions: Simulate Read-only' },
  { id: 'permissions.restoreEditing', label: 'Permissions: Restore Editing' },
]);

export function searchCommands(query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return COMMANDS;
  return COMMANDS.filter((command) =>
    `${command.label} ${command.id} ${command.capability ?? ''}`.toLowerCase().includes(normalized),
  );
}

export function getCommand(id) {
  return COMMANDS.find((command) => command.id === id) ?? null;
}

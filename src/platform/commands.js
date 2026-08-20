export const COMMANDS = Object.freeze([
  { id: 'workspace.toggleSidebar', label: 'Toggle Primary Sidebar', shortcut: 'Ctrl/Cmd+B' },
  { id: 'workspace.toggleInspector', label: 'Toggle Inspector', shortcut: 'Ctrl/Cmd+Alt+I' },
  { id: 'workspace.toggleBottomPanel', label: 'Toggle Bottom Panel', shortcut: 'Ctrl/Cmd+J' },
  { id: 'editor.splitRight', label: 'Split Editor Right', shortcut: 'Ctrl/Cmd+\\' },
  { id: 'workspace.preset.maximum', label: 'Workspace: Maximum' },
  { id: 'workspace.preset.focus', label: 'Workspace: Focus' },
  { id: 'workspace.preset.research', label: 'Workspace: Research' },
  { id: 'workspace.preset.development', label: 'Workspace: Development' },
  { id: 'workspace.preset.review', label: 'Workspace: Review' },
  { id: 'workspace.preset.zen', label: 'Workspace: Zen' },
  { id: 'appearance.toggleTheme', label: 'Change Theme', shortcut: 'Ctrl/Cmd+Shift+L' },
  { id: 'appearance.cycleDensity', label: 'Cycle Density' },
  { id: 'resource.openArchitecture', label: 'Open Architecture' },
  { id: 'jobs.startExport', label: 'Start Project Export' },
  { id: 'connection.toggleOffline', label: 'Toggle Offline Simulation' },
]);

export function searchCommands(query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return COMMANDS;
  return COMMANDS.filter((command) =>
    `${command.label} ${command.id}`.toLowerCase().includes(normalized),
  );
}

export function getCommand(id) {
  return COMMANDS.find((command) => command.id === id) ?? null;
}

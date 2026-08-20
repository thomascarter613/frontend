export const RESOURCES = Object.freeze({
  'project-platform-redesign': {
    id: 'project-platform-redesign',
    type: 'project',
    title: 'Platform Redesign',
    status: 'Active',
    owner: 'Product Systems',
    priority: 'High',
    updated: 'Today',
    path: ['Projects', 'Active', 'Platform Redesign'],
    tags: ['platform', 'design-system'],
  },
  'document-architecture': {
    id: 'document-architecture',
    type: 'document',
    title: 'Architecture',
    status: 'Review',
    owner: 'Systems',
    priority: 'High',
    updated: '12m ago',
    path: ['Projects', 'Active', 'Platform Redesign', 'Architecture'],
    tags: ['architecture', 'frontend'],
    body: `# Architecture\n\nThe workstation is a persistent operating environment for professional knowledge work. Resource identity remains stable while the user changes views, panes, and workspace modes.\n\n## System Components\n\n- Application Shell\n- Resource & View Registry\n- Command System\n- Workspace State\n- Permissions & Extensions\n- Reliability Layer`,
  },
  'table-project-metrics': {
    id: 'table-project-metrics',
    type: 'table',
    title: 'Project Metrics',
    status: 'Live',
    owner: 'Analytics',
    priority: 'Normal',
    updated: '4m ago',
    path: ['Data', 'Reports', 'Project Metrics'],
    tags: ['metrics'],
  },
  'task-shell-keyboard': {
    id: 'task-shell-keyboard',
    type: 'task',
    title: 'Keyboard navigation audit',
    status: 'In Progress',
    owner: 'Experience',
    priority: 'High',
    updated: '31m ago',
    path: ['Projects', 'Platform Redesign', 'Tasks', 'Keyboard navigation audit'],
    tags: ['accessibility', 'keyboard'],
  },
  'workflow-release': {
    id: 'workflow-release',
    type: 'workflow',
    title: 'Release workflow',
    status: 'Active',
    owner: 'Operations',
    priority: 'Normal',
    updated: 'Yesterday',
    path: ['Automations', 'Release workflow'],
    tags: ['automation'],
  },
});

export const MODULES = Object.freeze([
  ['home', 'Home'],
  ['explorer', 'Explorer'],
  ['search', 'Search'],
  ['projects', 'Projects'],
  ['documents', 'Documents'],
  ['tasks', 'Tasks'],
  ['data', 'Data'],
  ['analytics', 'Analytics'],
  ['automations', 'Automations'],
  ['extensions', 'Extensions'],
]);

export function getResource(id) {
  return RESOURCES[id] ?? null;
}

export function listResources() {
  return Object.values(RESOURCES);
}

export function resourcesForModule(moduleId) {
  const byType = {
    projects: ['project-platform-redesign', 'document-architecture', 'task-shell-keyboard'],
    documents: ['document-architecture'],
    tasks: ['task-shell-keyboard'],
    data: ['table-project-metrics'],
    analytics: ['table-project-metrics'],
    automations: ['workflow-release'],
  };
  const ids = byType[moduleId] ?? Object.keys(RESOURCES);
  return ids.map((id) => RESOURCES[id]);
}

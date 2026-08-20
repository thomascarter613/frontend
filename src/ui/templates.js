import { COMMANDS } from '../platform/commands.js';
import { MODULES, getResource, resourcesForModule } from '../platform/resources.js';
import { WORKSPACE_PRESETS } from '../workspace/presets.js';
import { icon } from './icons.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function activityRail(state) {
  if (!state.workspace.activityRail) return '';
  return `<aside class="activity-rail" aria-label="Application modes">
    <div class="rail-stack">
      ${MODULES.map(([id, label]) => `<button class="rail-button ${state.navigation.module === id ? 'is-active' : ''}" data-module="${id}" aria-label="${label}" title="${label}">${icon(id, label)}</button>`).join('')}
    </div>
    <div class="rail-stack rail-bottom">
      <button class="rail-button" data-action="open-settings" aria-label="Settings" title="Settings">${icon('settings', 'Settings')}</button>
    </div>
  </aside>`;
}

function resourceRow(resource, state) {
  const active = state.selectedResourceId === resource.id;
  return `<button class="tree-row ${active ? 'is-selected' : ''}" data-open-resource="${resource.id}" data-resource-context="${resource.id}">
    <span class="tree-leading">${icon(resource.type === 'project' ? 'projects' : resource.type === 'task' ? 'tasks' : resource.type === 'table' ? 'data' : resource.type === 'workflow' ? 'automations' : 'documents')}</span>
    <span class="tree-label">${escapeHtml(resource.title)}</span>
    <span class="tree-meta">${escapeHtml(resource.status)}</span>
  </button>`;
}

function sidebar(state) {
  if (state.workspace.sidebar === 'hidden') return '';
  const resources = resourcesForModule(state.navigation.module);
  return `<aside class="primary-sidebar" style="--sidebar-width:${state.workspace.sidebarWidth}px" aria-label="Primary sidebar">
    <div class="sidebar-header">
      <strong>${escapeHtml(MODULES.find(([id]) => id === state.navigation.module)?.[1] ?? 'Explorer')}</strong>
      <div class="toolbar"><button class="icon-button" data-action="open-command" aria-label="Filter">${icon('search')}</button><button class="icon-button" data-action="toggle-sidebar" aria-label="Collapse sidebar">${icon('panel')}</button></div>
    </div>
    <div class="sidebar-search"><input type="search" placeholder="Filter resources…" aria-label="Filter resources" /></div>
    <div class="tree-section">
      <div class="tree-heading">Workspace</div>
      ${resources.map((resource) => resourceRow(resource, state)).join('')}
    </div>
    <div class="sidebar-section"><div class="tree-heading">Saved Views</div><button class="tree-row"><span class="tree-leading">${icon('documents')}</span><span class="tree-label">Recently updated</span></button><button class="tree-row"><span class="tree-leading">${icon('tasks')}</span><span class="tree-label">Needs review</span></button></div>
  </aside><div class="resizer vertical" data-resizer="sidebar" role="separator" aria-label="Resize primary sidebar"></div>`;
}

function globalBar(state) {
  return `<header class="global-bar">
    <div class="global-left"><div class="product-mark">M</div><button class="workspace-switcher">Product &amp; Research <span>⌄</span></button></div>
    <button class="command-trigger" data-action="open-command"><span>${icon('search')}</span><span>Search, navigate, or run a command…</span><kbd>Ctrl K</kbd></button>
    <div class="global-actions"><button class="icon-button" aria-label="Notifications">${icon('bell')}</button><button class="icon-button" data-action="toggle-theme" aria-label="Toggle theme">${icon(state.appearance.theme === 'dark' ? 'moon' : 'sun')}</button><div class="avatar" aria-label="Account">TC</div></div>
  </header>`;
}

function workspaceHeader(state) {
  const resource = getResource(state.selectedResourceId) ?? getResource('project-platform-redesign');
  return `<div class="workspace-header">
    <div class="workspace-title"><span class="resource-icon">${icon(resource.type === 'project' ? 'projects' : 'documents')}</span><div><strong>${escapeHtml(resource.title)}</strong><span class="workspace-subtitle">${escapeHtml(resource.type)} · ${escapeHtml(resource.owner)}</span></div></div>
    <div class="header-actions"><span class="status status-active">${escapeHtml(resource.status)}</span><div class="avatar-group"><span class="avatar small">AR</span><span class="avatar small">MK</span><span class="avatar small">JL</span></div><button class="button secondary">Share</button><button class="button">New</button><button class="icon-button">${icon('more')}</button></div>
  </div>`;
}

function breadcrumbs(state) {
  const resource = getResource(state.selectedResourceId);
  const path = resource?.path ?? ['Workspace'];
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${path.map((segment, index) => `<button>${escapeHtml(segment)}</button>${index < path.length - 1 ? '<span>/</span>' : ''}`).join('')}</nav>`;
}

function tabStrip(group, state) {
  return `<div class="tab-strip" role="tablist">
    ${group.tabs.map((id) => {
      const resource = getResource(id);
      if (!resource) return '';
      const modified = Object.hasOwn(state.drafts, id);
      return `<div class="tab ${group.active === id ? 'is-active' : ''}" role="tab" aria-selected="${group.active === id}" draggable="true" data-tab-resource="${id}" data-group-id="${group.id}">
        <button class="tab-main" data-activate-tab="${id}" data-group-id="${group.id}"><span>${escapeHtml(resource.title)}</span>${modified ? '<span class="modified-dot" aria-label="Modified"></span>' : ''}</button>
        <button class="tab-close" data-close-tab="${id}" data-group-id="${group.id}" aria-label="Close ${escapeHtml(resource.title)}">${icon('close')}</button>
      </div>`;
    }).join('')}
    <button class="tab-add" data-action="open-command" aria-label="Open resource">+</button>
  </div>`;
}

function documentView(resource, state) {
  const draft = state.drafts[resource.id] ?? resource.body ?? '';
  return `<article class="document-surface">
    <div class="surface-eyebrow">DOCUMENT · ${escapeHtml(resource.status.toUpperCase())}</div>
    <h1>${escapeHtml(resource.title)}</h1>
    <textarea class="document-editor" data-document-editor="${resource.id}" aria-label="Edit ${escapeHtml(resource.title)}">${escapeHtml(draft)}</textarea>
    <section class="structured-section"><h2>System Components</h2><div class="component-list"><div>Application Shell <span class="status">Active</span></div><div>Resource &amp; View Registry <span class="status status-review">Review</span></div><div>Command System <span class="status">Active</span></div></div></section>
  </article>`;
}

function tableView() {
  const rows = [
    ['Application Shell', 'Design Systems', 'Active', 'Today', 92],
    ['Resource Layer', 'Platform', 'Review', '2h ago', 76],
    ['Search Service', 'Platform', 'Planned', 'Yesterday', 48],
    ['Automation Engine', 'Operations', 'Active', '3h ago', 84],
    ['Permissions', 'Security', 'Review', '1d ago', 67],
  ];
  return `<section class="data-surface"><div class="surface-heading"><div><span class="surface-eyebrow">TABLE VIEW</span><h2>Project Metrics</h2></div><div class="view-actions"><button class="button secondary">Filter</button><button class="button secondary">Columns</button></div></div><div class="metric-strip"><div><span>Delivery</span><strong>78%</strong></div><div><span>Open items</span><strong>24</strong></div><div><span>Review queue</span><strong>7</strong></div></div><div class="table-wrap"><table><thead><tr><th>Component</th><th>Owner</th><th>Status</th><th>Updated</th><th>Progress</th></tr></thead><tbody>${rows.map(([name, owner, status, updated, progress]) => `<tr><td>${name}</td><td>${owner}</td><td><span class="status ${status === 'Review' ? 'status-review' : ''}">${status}</span></td><td>${updated}</td><td><div class="progress"><span style="width:${progress}%"></span></div></td></tr>`).join('')}</tbody></table></div></section>`;
}

function taskView(resource) {
  return `<section class="task-surface"><span class="surface-eyebrow">TASK</span><h1>${escapeHtml(resource.title)}</h1><p>Verify keyboard-only navigation across rail, sidebar, tree, tabs, editor, command palette, inspector, and utility panel.</p><div class="property-grid"><div><span>Status</span><strong>${escapeHtml(resource.status)}</strong></div><div><span>Owner</span><strong>${escapeHtml(resource.owner)}</strong></div><div><span>Priority</span><strong>${escapeHtml(resource.priority)}</strong></div><div><span>Updated</span><strong>${escapeHtml(resource.updated)}</strong></div></div><h2>Acceptance</h2><label class="check-row"><input type="checkbox" checked /> Focus indicators remain visible</label><label class="check-row"><input type="checkbox" /> Escape-stack restores focus</label><label class="check-row"><input type="checkbox" /> All icon controls have names</label></section>`;
}

function workflowView() {
  return `<section class="workflow-surface"><span class="surface-eyebrow">WORKFLOW</span><h1>Release workflow</h1><div class="workflow-canvas"><div class="workflow-node">Draft ready<small>Trigger</small></div><div class="workflow-edge">→</div><div class="workflow-node">Run checks<small>Action</small></div><div class="workflow-edge">→</div><div class="workflow-node active">Approval<small>Decision</small></div><div class="workflow-edge">→</div><div class="workflow-node">Publish<small>Action</small></div></div><div class="run-log"><strong>Latest run</strong><span>4 steps · Success · 7m ago</span></div></section>`;
}

function renderResource(resource, state) {
  if (!resource) return '<div class="empty-state">No resource is open in this editor group.</div>';
  if (resource.type === 'document') return documentView(resource, state);
  if (resource.type === 'table') return tableView(resource, state);
  if (resource.type === 'task') return taskView(resource);
  if (resource.type === 'workflow') return workflowView(resource);
  return `<section class="project-surface"><span class="surface-eyebrow">PROJECT</span><h1>${escapeHtml(resource.title)}</h1><p>Cross-functional program workspace combining documents, tasks, structured data, analytics, automations, and activity.</p></section>`;
}

function editorGroup(group, state) {
  const resource = getResource(group.active);
  return `<section class="editor-group ${state.editors.activeGroup === group.id ? 'is-active-group' : ''}" data-editor-group="${group.id}">
    ${tabStrip(group, state)}
    <div class="editor-content">${renderResource(resource, state)}</div>
  </section>`;
}

function editorGrid(state) {
  const groups = state.workspace.secondaryEditor ? state.editors.groups : [state.editors.groups.find((group) => group.id === state.editors.activeGroup) ?? state.editors.groups[0]];
  return `<div class="editor-grid" style="--editor-split:${state.workspace.editorSplit}%">${groups.map((group, index) => `${index === 1 ? '<div class="resizer vertical editor-resizer" data-resizer="editor" role="separator" aria-label="Resize editor split"></div>' : ''}${editorGroup(group, state)}`).join('')}</div>`;
}

function inspector(state) {
  if (state.workspace.inspector === 'hidden') return '';
  const resource = getResource(state.selectedResourceId);
  const tabs = ['properties', 'activity', 'relations'];
  return `<div class="resizer vertical" data-resizer="inspector" role="separator" aria-label="Resize inspector"></div><aside class="inspector" style="--inspector-width:${state.workspace.inspectorWidth}px" aria-label="Inspector">
    <div class="panel-tabs">${tabs.map((tab) => `<button class="${state.workspace.inspectorTab === tab ? 'is-active' : ''}" data-inspector-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<button class="icon-button push-right" data-action="toggle-inspector">${icon('close')}</button></div>
    <div class="inspector-body">${resource ? `<div class="inspector-title"><span class="resource-icon">${icon(resource.type === 'task' ? 'tasks' : resource.type === 'table' ? 'data' : 'documents')}</span><div><strong>${escapeHtml(resource.title)}</strong><span>${escapeHtml(resource.type)}</span></div></div>` : ''}
      ${state.workspace.inspectorTab === 'activity' ? '<div class="activity-feed"><div><span class="avatar small">AR</span><p><strong>Avery</strong> updated status <time>12m</time></p></div><div><span class="avatar small">MK</span><p><strong>Morgan</strong> added a comment <time>39m</time></p></div></div>' : `<div class="property-list"><div><span>Status</span><button>${escapeHtml(resource?.status ?? '—')}</button></div><div><span>Owner</span><button>${escapeHtml(resource?.owner ?? '—')}</button></div><div><span>Priority</span><button>${escapeHtml(resource?.priority ?? '—')}</button></div><div><span>Updated</span><span>${escapeHtml(resource?.updated ?? '—')}</span></div><div><span>Visibility</span><button>Workspace</button></div></div><details open><summary>Metadata</summary><div class="details-copy">Stable Resource ID<br><code>${escapeHtml(resource?.id ?? 'none')}</code></div></details><details><summary>Permissions</summary><div class="details-copy">Capability-based access inherited from workspace policy.</div></details>`}
    </div>
  </aside>`;
}

function bottomPanel(state) {
  if (state.workspace.bottomPanel === 'hidden') return '';
  const tabs = ['problems', 'output', 'activity', 'logs', 'terminal'];
  const active = state.workspace.bottomPanelTab;
  const content = active === 'terminal'
    ? '<pre class="terminal">$ npm run check\n✓ state tests\n✓ command tests\n✓ render smoke\n\nworkspace@0.1.0 ready</pre>'
    : `<div class="activity-lines"><div><time>19:01</time><span>Workspace synchronized</span><em>system</em></div><div><time>18:58</time><span>Architecture document updated</span><em>document</em></div><div><time>18:54</time><span>Search index refreshed</span><em>job</em></div><div><time>18:51</time><span>Release workflow completed</span><em>automation</em></div></div>`;
  return `<div class="resizer horizontal" data-resizer="bottom" role="separator" aria-label="Resize bottom panel"></div><section class="bottom-panel" style="--bottom-height:${state.workspace.bottomPanelHeight}px"><div class="panel-tabs">${tabs.map((tab) => `<button class="${active === tab ? 'is-active' : ''}" data-bottom-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<span class="panel-count">${active === 'problems' ? '2' : ''}</span><button class="icon-button push-right" data-action="toggle-bottom-panel">${icon('close')}</button></div>${content}</section>`;
}

function statusBar(state) {
  const running = state.jobs.filter((job) => job.state === 'running').length;
  return `<footer class="status-bar"><div><button>main</button><button>${state.connection.sync === 'synced' ? '✓' : '↻'} ${escapeHtml(state.connection.sync)}</button><button>${escapeHtml(state.workspace.preset)}</button></div><div><button data-action="start-export">Jobs ${running}</button><button data-action="toggle-offline">${icon('wifi')} ${state.connection.online ? 'Online' : 'Offline'}</button><button>UTF-8</button><button>v0.1</button></div></footer>`;
}

function commandPalette(state) {
  if (state.overlay?.type !== 'command') return '';
  const query = state.overlay.query ?? '';
  const visible = COMMANDS.filter((command) => `${command.label} ${command.id}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  return `<div class="overlay-backdrop" data-action="close-overlay"><section class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" data-overlay-content><div class="command-input-wrap">${icon('command')}<input id="command-input" data-command-input value="${escapeHtml(query)}" placeholder="Type a command or search…" autofocus /><kbd>Esc</kbd></div><div class="command-section-label">Commands</div><div class="command-results">${visible.map((command, index) => `<button class="command-row ${index === 0 ? 'is-selected' : ''}" data-run-command="${command.id}"><span>${escapeHtml(command.label)}</span><kbd>${escapeHtml(command.shortcut ?? '')}</kbd></button>`).join('') || '<div class="empty-state compact">No commands found</div>'}</div></section></div>`;
}

function settingsDialog(state) {
  if (state.overlay?.type !== 'settings') return '';
  return `<div class="overlay-backdrop" data-action="close-overlay"><section class="settings-dialog" role="dialog" aria-modal="true" aria-label="Workspace settings" data-overlay-content><div class="dialog-header"><div><span class="surface-eyebrow">PREFERENCES</span><h2>Workspace settings</h2></div><button class="icon-button" data-action="close-overlay">${icon('close')}</button></div><div class="settings-grid"><label>Theme<select data-setting="theme"><option value="dark" ${state.appearance.theme === 'dark' ? 'selected' : ''}>Dark</option><option value="light" ${state.appearance.theme === 'light' ? 'selected' : ''}>Light</option></select></label><label>Density<select data-setting="density"><option value="compact" ${state.appearance.density === 'compact' ? 'selected' : ''}>Compact</option><option value="default" ${state.appearance.density === 'default' ? 'selected' : ''}>Default</option><option value="comfortable" ${state.appearance.density === 'comfortable' ? 'selected' : ''}>Comfortable</option></select></label></div><div class="preset-list"><span>Workspace preset</span>${Object.values(WORKSPACE_PRESETS).map((preset) => `<button class="${state.workspace.preset === preset.id ? 'is-active' : ''}" data-preset="${preset.id}">${preset.label}</button>`).join('')}</div></section></div>`;
}

function contextMenu(state) {
  if (state.overlay?.type !== 'context') return '';
  return `<div class="context-menu" data-overlay-content style="left:${state.overlay.x}px;top:${state.overlay.y}px" role="menu"><button data-open-resource="${state.overlay.resourceId}">Open</button><button data-context-action="side">Open to the Side</button><button>Copy Link</button><hr/><button>Add to Favorites</button><button>Rename</button><hr/><button class="danger">Delete</button></div>`;
}

function toastStack(state) {
  return `<div class="toast-stack" aria-live="polite">${state.toasts.map((toast) => `<div class="toast"><div><strong>${escapeHtml(toast.title)}</strong><span>${escapeHtml(toast.message ?? '')}</span></div><button class="icon-button" data-dismiss-toast="${toast.id}">${icon('close')}</button></div>`).join('')}</div>`;
}

export function renderApp(state) {
  return `<div class="app-shell" data-theme="${state.appearance.theme}" data-density="${state.appearance.density}">
    ${globalBar(state)}
    <div class="workspace-body">
      ${activityRail(state)}
      ${sidebar(state)}
      <main class="main-workspace">
        ${workspaceHeader(state)}
        ${breadcrumbs(state)}
        <div class="editor-and-panel">${editorGrid(state)}${bottomPanel(state)}</div>
      </main>
      ${inspector(state)}
    </div>
    ${statusBar(state)}
    <div class="overlay-layer">${commandPalette(state)}${settingsDialog(state)}${contextMenu(state)}</div>
    ${toastStack(state)}
  </div>`;
}

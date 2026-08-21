import { createAccessibilityContract } from '../platform/accessibility.js';
import { safeRender } from '../platform/async-boundary.js';
import { hasCapability } from '../platform/permissions.js';
import { resolveResourceView } from '../platform/runtime.js';
import { isSelected, selectionCount } from '../platform/selection.js';
import { escapeHtml } from './html.js';

const TABLE_ACCESSIBILITY = createAccessibilityContract({ role: 'grid', name: 'Project metrics', keyboard: ['Arrow keys move focus', 'Space selects', 'Shift extends selection'], focus: 'roving rows', announcements: ['selection count'] });

function documentView(resource, state) {
  const draft = state.drafts[resource.id] ?? resource.body ?? '';
  const canEdit = hasCapability(state.permissions, 'resource.update');
  return `<article class="document-surface"><div class="surface-eyebrow">DOCUMENT · ${escapeHtml(resource.status.toUpperCase())}</div><h1>${escapeHtml(resource.title)}</h1>${canEdit ? '' : '<div class="permission-banner" role="status">Read-only · your existing local draft is preserved</div>'}<textarea class="document-editor" data-document-editor="${resource.id}" aria-label="Edit ${escapeHtml(resource.title)}" ${canEdit ? '' : 'readonly'}>${escapeHtml(draft)}</textarea><section class="structured-section"><h2>System Components</h2><div class="component-list"><div>Application Shell <span class="status">Active</span></div><div>Resource &amp; View Registry <span class="status status-review">Review</span></div><div>Command System <span class="status">Active</span></div></div></section></article>`;
}

function tableView(resource, state) {
  const rows = [['component-shell', 'Application Shell', 'Design Systems', 'Active', 'Today', 92], ['component-resource', 'Resource Layer', 'Platform', 'Review', '2h ago', 76], ['component-search', 'Search Service', 'Platform', 'Planned', 'Yesterday', 48], ['component-automation', 'Automation Engine', 'Operations', 'Active', '3h ago', 84], ['component-permissions', 'Permissions', 'Security', 'Review', '1d ago', 67]];
  const scope = `table:${resource.id}`;
  const count = state.selection.scope === scope ? selectionCount(state.selection, rows.length) : 0;
  return `<section class="data-surface"><div class="surface-heading"><div><span class="surface-eyebrow">TABLE VIEW</span><h2>Project Metrics</h2></div><div class="view-actions">${count ? `<span class="selection-count" role="status">${count} selected</span>` : ''}<button class="button secondary">Filter</button><button class="button secondary">Columns</button></div></div><div class="metric-strip"><div><span>Delivery</span><strong>78%</strong></div><div><span>Open items</span><strong>24</strong></div><div><span>Review queue</span><strong>7</strong></div></div><div class="table-wrap"><table role="${TABLE_ACCESSIBILITY.role}" aria-label="${TABLE_ACCESSIBILITY.name}"><thead><tr><th>Component</th><th>Owner</th><th>Status</th><th>Updated</th><th>Progress</th></tr></thead><tbody>${rows.map(([id, name, owner, status, updated, progress]) => { const selected = state.selection.scope === scope && isSelected(state.selection, id); return `<tr role="row" tabindex="0" class="${selected ? 'is-selected' : ''}" aria-selected="${selected}" data-select-item="${id}" data-selection-scope="${scope}"><td>${name}</td><td>${owner}</td><td><span class="status ${status === 'Review' ? 'status-review' : ''}">${status}</span></td><td>${updated}</td><td><div class="progress"><span style="width:${progress}%"></span></div></td></tr>`; }).join('')}</tbody></table></div></section>`;
}

function taskView(resource) { return `<section class="task-surface"><span class="surface-eyebrow">TASK</span><h1>${escapeHtml(resource.title)}</h1><p>Verify keyboard-only navigation across rail, sidebar, tree, tabs, editor, command palette, inspector, and utility panel.</p><div class="property-grid"><div><span>Status</span><strong>${escapeHtml(resource.status)}</strong></div><div><span>Owner</span><strong>${escapeHtml(resource.owner)}</strong></div><div><span>Priority</span><strong>${escapeHtml(resource.priority)}</strong></div><div><span>Updated</span><strong>${escapeHtml(resource.updated)}</strong></div></div></section>`; }
function workflowView() { return `<section class="workflow-surface"><span class="surface-eyebrow">WORKFLOW</span><h1>Release workflow</h1><div class="workflow-canvas"><div class="workflow-node">Draft ready<small>Trigger</small></div><div class="workflow-edge">→</div><div class="workflow-node">Run checks<small>Action</small></div><div class="workflow-edge">→</div><div class="workflow-node active">Approval<small>Decision</small></div><div class="workflow-edge">→</div><div class="workflow-node">Publish<small>Action</small></div></div></section>`; }

export function renderResource(resource, state) {
  if (!resource) return '<div class="empty-state">No resource is open in this editor group.</div>';
  const view = resolveResourceView(resource);
  const result = safeRender(() => {
    if (view?.id === 'view.document') return documentView(resource, state);
    if (view?.id === 'view.table') return tableView(resource, state);
    if (view?.id === 'view.task') return taskView(resource);
    if (view?.id === 'view.workflow') return workflowView(resource);
    if (view?.id === 'view.project') return `<section class="project-surface"><span class="surface-eyebrow">PROJECT</span><h1>${escapeHtml(resource.title)}</h1><p>Cross-functional program workspace combining documents, tasks, structured data, analytics, automations, and activity.</p></section>`;
    return `<div class="empty-state">No registered View can render ${escapeHtml(resource.type)}.</div>`;
  }, (error) => `<div class="empty-state" role="alert">This View could not be rendered. Your workspace remains available.<details><summary>Details</summary><code>${escapeHtml(error?.message ?? 'Unknown rendering failure')}</code></details></div>`, { scope: `view:${view?.id ?? resource.type}` });
  return result.value;
}

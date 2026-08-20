import { hasCapability } from '../platform/permissions.js';
import { resolveResourceView } from '../platform/runtime.js';
import { escapeHtml } from './html.js';

function documentView(resource, state) {
  const draft = state.drafts[resource.id] ?? resource.body ?? '';
  const canEdit = hasCapability(state.permissions, 'resource.update');
  return `<article class="document-surface">
    <div class="surface-eyebrow">DOCUMENT · ${escapeHtml(resource.status.toUpperCase())}</div>
    <h1>${escapeHtml(resource.title)}</h1>
    ${canEdit ? '' : '<div class="permission-banner" role="status">Read-only · your existing local draft is preserved</div>'}
    <textarea class="document-editor" data-document-editor="${resource.id}" aria-label="Edit ${escapeHtml(resource.title)}" ${canEdit ? '' : 'readonly'}>${escapeHtml(draft)}</textarea>
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

export function renderResource(resource, state) {
  if (!resource) return '<div class="empty-state">No resource is open in this editor group.</div>';
  const view = resolveResourceView(resource);
  if (view?.id === 'view.document') return documentView(resource, state);
  if (view?.id === 'view.table') return tableView(resource, state);
  if (view?.id === 'view.task') return taskView(resource);
  if (view?.id === 'view.workflow') return workflowView(resource);
  if (view?.id === 'view.project') return `<section class="project-surface"><span class="surface-eyebrow">PROJECT</span><h1>${escapeHtml(resource.title)}</h1><p>Cross-functional program workspace combining documents, tasks, structured data, analytics, automations, and activity.</p></section>`;
  return `<div class="empty-state">No registered View can render ${escapeHtml(resource.type)}.</div>`;
}


import { getResource } from '../platform/resources.js';
import { renderCompactResourceForm } from './forms.js';
import { icon } from './icons.js';
import { escapeHtml } from './html.js';

export function inspector(state) {
  if (state.workspace.inspector === 'hidden') return '';
  const resource = getResource(state.selectedResourceId);
  const tabs = ['properties', 'activity', 'relations'];
  const body = state.workspace.inspectorTab === 'activity'
    ? `<div class="activity-feed">${state.activity.slice(0, 8).map((event) => `<div><span class="avatar small">${escapeHtml(String(event.actor ?? 'S').slice(0, 2).toUpperCase())}</span><p><strong>${escapeHtml(event.actor ?? 'system')}</strong> ${escapeHtml(event.summary)} <time>${new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></p></div>`).join('') || '<div class="empty-state compact">No activity yet.</div>'}</div>`
    : state.workspace.inspectorTab === 'relations'
      ? `<div class="property-list"><div><span>Parent</span><button>${escapeHtml(resource?.path?.at(-2) ?? 'Workspace')}</button></div><div><span>Dependencies</span><button>2 linked resources</button></div><div><span>References</span><button>4 inbound links</button></div></div>`
      : `${renderCompactResourceForm(resource)}<details open><summary>Metadata</summary><div class="details-copy">Stable Resource ID<br><code>${escapeHtml(resource?.id ?? 'none')}</code></div></details><details><summary>Permissions</summary><div class="details-copy">Capability policy · ${state.permissions.allow.length} allowed · ${state.permissions.deny.length} denied<br><code>${escapeHtml(state.permissions.deny.join(', ') || 'no explicit denies')}</code></div></details>`;
  return `<div class="resizer vertical" data-resizer="inspector" role="separator" aria-label="Resize inspector"></div><aside class="inspector" style="--inspector-width:${state.workspace.inspectorWidth}px" aria-label="Inspector">
    <div class="panel-tabs">${tabs.map((tab) => `<button class="${state.workspace.inspectorTab === tab ? 'is-active' : ''}" data-inspector-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<button class="icon-button push-right" data-action="toggle-inspector">${icon('close')}</button></div>
    <div class="inspector-body">${resource ? `<div class="inspector-title"><span class="resource-icon">${icon(resource.type === 'task' ? 'tasks' : resource.type === 'table' ? 'data' : 'documents')}</span><div><strong>${escapeHtml(resource.title)}</strong><span>${escapeHtml(resource.type)}</span></div></div>` : ''}${body}</div>
  </aside>`;
}

function jobRows(state) {
  if (!state.jobs.length) return '<div class="empty-state compact">No background jobs.</div>';
  return `<div class="job-list">${state.jobs.map((job) => `<div class="job-row"><div><strong>${escapeHtml(job.label ?? job.title ?? job.kind ?? 'Job')}</strong><span>${escapeHtml(job.state)}${job.attempt ? ` · attempt ${job.attempt}` : ''}</span></div><div class="job-progress"><span style="width:${Math.max(0, Math.min(100, job.progress ?? 0))}%"></span></div></div>`).join('')}</div>`;
}

function activityRows(state) {
  if (!state.activity.length) return '<div class="empty-state compact">No activity events.</div>';
  return `<div class="activity-lines">${state.activity.slice(0, 30).map((event) => `<div><time>${new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><span>${escapeHtml(event.summary)}</span><em>${escapeHtml(event.type)}</em></div>`).join('')}</div>`;
}

export function bottomPanel(state) {
  if (state.workspace.bottomPanel === 'hidden') return '';
  const tabs = ['problems', 'output', 'activity', 'jobs', 'logs', 'terminal'];
  const active = state.workspace.bottomPanelTab;
  const content = active === 'terminal'
    ? '<pre class="terminal">$ npm run check\n✓ platform contracts\n✓ interaction contracts\n✓ renderer smoke\n\nworkspace@0.1.0 ready</pre>'
    : active === 'jobs' ? jobRows(state)
      : active === 'activity' ? activityRows(state)
        : `<div class="activity-lines"><div><time>—</time><span>${active === 'problems' ? 'No unresolved problems' : `${active} stream ready`}</span><em>system</em></div></div>`;
  return `<div class="resizer horizontal" data-resizer="bottom" role="separator" aria-label="Resize bottom panel"></div><section class="bottom-panel" style="--bottom-height:${state.workspace.bottomPanelHeight}px"><div class="panel-tabs">${tabs.map((tab) => `<button class="${active === tab ? 'is-active' : ''}" data-bottom-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<span class="panel-count">${active === 'jobs' ? state.jobs.length : active === 'problems' ? state.errors.length : ''}</span><button class="icon-button push-right" data-action="toggle-bottom-panel">${icon('close')}</button></div>${content}</section>`;
}

export function statusBar(state) {
  const running = state.jobs.filter((job) => ['running', 'queued', 'retrying'].includes(job.state)).length;
  const connectionLabel = state.connection.status === 'online' ? 'Online' : state.connection.status[0].toUpperCase() + state.connection.status.slice(1);
  return `<footer class="status-bar"><div><button>main</button><button>${state.connection.sync === 'synced' ? '✓' : '↻'} ${escapeHtml(state.connection.sync)}</button><button>${escapeHtml(state.workspace.preset)}</button></div><div><button data-bottom-tab="jobs">Jobs ${running}</button><button data-action="toggle-offline">${icon('wifi')} ${escapeHtml(connectionLabel)}</button><button>UTF-8</button><button>v0.1</button></div></footer>`;
}

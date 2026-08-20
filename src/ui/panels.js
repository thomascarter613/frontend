import { getResource } from '../platform/resources.js';
import { icon } from './icons.js';
import { escapeHtml } from './html.js';

export function inspector(state) {
  if (state.workspace.inspector === 'hidden') return '';
  const resource = getResource(state.selectedResourceId);
  const tabs = ['properties', 'activity', 'relations'];
  return `<div class="resizer vertical" data-resizer="inspector" role="separator" aria-label="Resize inspector"></div><aside class="inspector" style="--inspector-width:${state.workspace.inspectorWidth}px" aria-label="Inspector">
    <div class="panel-tabs">${tabs.map((tab) => `<button class="${state.workspace.inspectorTab === tab ? 'is-active' : ''}" data-inspector-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<button class="icon-button push-right" data-action="toggle-inspector">${icon('close')}</button></div>
    <div class="inspector-body">${resource ? `<div class="inspector-title"><span class="resource-icon">${icon(resource.type === 'task' ? 'tasks' : resource.type === 'table' ? 'data' : 'documents')}</span><div><strong>${escapeHtml(resource.title)}</strong><span>${escapeHtml(resource.type)}</span></div></div>` : ''}
      ${state.workspace.inspectorTab === 'activity' ? '<div class="activity-feed"><div><span class="avatar small">AR</span><p><strong>Avery</strong> updated status <time>12m</time></p></div><div><span class="avatar small">MK</span><p><strong>Morgan</strong> added a comment <time>39m</time></p></div></div>' : `<div class="property-list"><div><span>Status</span><button>${escapeHtml(resource?.status ?? '—')}</button></div><div><span>Owner</span><button>${escapeHtml(resource?.owner ?? '—')}</button></div><div><span>Priority</span><button>${escapeHtml(resource?.priority ?? '—')}</button></div><div><span>Updated</span><span>${escapeHtml(resource?.updated ?? '—')}</span></div><div><span>Visibility</span><button>Workspace</button></div></div><details open><summary>Metadata</summary><div class="details-copy">Stable Resource ID<br><code>${escapeHtml(resource?.id ?? 'none')}</code></div></details><details><summary>Permissions</summary><div class="details-copy">Capability policy · ${state.permissions.allow.length} allowed · ${state.permissions.deny.length} denied<br><code>${escapeHtml(state.permissions.deny.join(', ') || 'no explicit denies')}</code></div></details>`}
    </div>
  </aside>`;
}

export function bottomPanel(state) {
  if (state.workspace.bottomPanel === 'hidden') return '';
  const tabs = ['problems', 'output', 'activity', 'logs', 'terminal'];
  const active = state.workspace.bottomPanelTab;
  const content = active === 'terminal'
    ? '<pre class="terminal">$ npm run check\n✓ state tests\n✓ command tests\n✓ render smoke\n\nworkspace@0.1.0 ready</pre>'
    : `<div class="activity-lines"><div><time>19:01</time><span>Workspace synchronized</span><em>system</em></div><div><time>18:58</time><span>Architecture document updated</span><em>document</em></div><div><time>18:54</time><span>Search index refreshed</span><em>job</em></div><div><time>18:51</time><span>Release workflow completed</span><em>automation</em></div></div>`;
  return `<div class="resizer horizontal" data-resizer="bottom" role="separator" aria-label="Resize bottom panel"></div><section class="bottom-panel" style="--bottom-height:${state.workspace.bottomPanelHeight}px"><div class="panel-tabs">${tabs.map((tab) => `<button class="${active === tab ? 'is-active' : ''}" data-bottom-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>`).join('')}<span class="panel-count">${active === 'problems' ? '2' : ''}</span><button class="icon-button push-right" data-action="toggle-bottom-panel">${icon('close')}</button></div>${content}</section>`;
}

export function statusBar(state) {
  const running = state.jobs.filter((job) => job.state === 'running').length;
  return `<footer class="status-bar"><div><button>main</button><button>${state.connection.sync === 'synced' ? '✓' : '↻'} ${escapeHtml(state.connection.sync)}</button><button>${escapeHtml(state.workspace.preset)}</button></div><div><button data-action="start-export">Jobs ${running}</button><button data-action="toggle-offline">${icon('wifi')} ${state.connection.online ? 'Online' : 'Offline'}</button><button>UTF-8</button><button>v0.1</button></div></footer>`;
}

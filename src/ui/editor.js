import { getResource } from '../platform/resources.js';
import { icon } from './icons.js';
import { escapeHtml } from './html.js';
import { renderResource } from './resource-views.js';

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

function editorGroup(group, state) {
  const resource = getResource(group.active);
  return `<section class="editor-group ${state.editors.activeGroup === group.id ? 'is-active-group' : ''}" data-editor-group="${group.id}">
    ${tabStrip(group, state)}
    <div class="editor-content">${renderResource(resource, state)}</div>
  </section>`;
}

function renderEditorNode(node, state, branch = 'root') {
  if (!node) return '';
  if (node.type === 'group') {
    const group = state.editors.groups.find((candidate) => candidate.id === node.groupId);
    return `<div class="editor-leaf editor-split-${branch}">${group ? editorGroup(group, state) : '<div class="empty-state">Missing editor group</div>'}</div>`;
  }
  const orientation = node.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  const percent = Math.round(node.ratio * 10000) / 100;
  return `<div class="editor-split editor-split-${orientation}" data-editor-split="${escapeHtml(node.id)}" style="--split-ratio:${percent}%">
    <div class="editor-split-primary">${renderEditorNode(node.first, state, 'primary')}</div>
    <div class="resizer ${orientation === 'vertical' ? 'vertical' : 'horizontal'} editor-tree-resizer" data-resizer="editor-split" data-split-id="${escapeHtml(node.id)}" data-orientation="${orientation}" role="separator" aria-label="Resize editor split"></div>
    <div class="editor-split-secondary">${renderEditorNode(node.second, state, 'secondary')}</div>
  </div>`;
}

export function editorGrid(state) {
  const active = state.editors.groups.find((group) => group.id === state.editors.activeGroup) ?? state.editors.groups[0];
  const content = state.workspace.secondaryEditor
    ? renderEditorNode(state.editors.layout, state)
    : `<div class="editor-leaf">${active ? editorGroup(active, state) : ''}</div>`;
  return `<div class="editor-grid">${content}</div>`;
}

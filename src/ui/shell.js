import { getResource } from '../platform/resources.js';
import { hasCapability } from '../platform/permissions.js';
import { unreadNotificationCount } from '../platform/events.js';
import { listWorkspaceActivities, resourcesForWorkspaceActivity } from '../platform/runtime.js';
import { icon } from './icons.js';
import { escapeHtml } from './html.js';

export function activityRail(state) {
  if (!state.workspace.activityRail) return '';
  const activities = listWorkspaceActivities();
  return `<aside class="activity-rail" aria-label="Application modes"><div class="rail-stack">${activities.map(({ id, label }) => `<button class="rail-button ${state.navigation.module === id ? 'is-active' : ''}" data-module="${id}" aria-label="${label}" title="${label}">${icon(id, label)}</button>`).join('')}</div><div class="rail-stack rail-bottom"><button class="rail-button" data-action="open-settings" aria-label="Settings" title="Settings">${icon('settings', 'Settings')}</button></div></aside>`;
}

function resourceRow(resource, state) {
  const active = state.selectedResourceId === resource.id;
  return `<button class="tree-row ${active ? 'is-selected' : ''}" data-open-resource="${resource.id}" data-resource-context="${resource.id}"><span class="tree-leading">${icon(resource.type === 'project' ? 'projects' : resource.type === 'task' ? 'tasks' : resource.type === 'table' ? 'data' : resource.type === 'workflow' ? 'automations' : 'documents')}</span><span class="tree-label">${escapeHtml(resource.title)}</span><span class="tree-meta">${escapeHtml(resource.status)}</span></button>`;
}

export function sidebar(state) {
  if (state.workspace.sidebar === 'hidden') return '';
  const activities = listWorkspaceActivities();
  const activity = activities.find(({ id }) => id === state.navigation.module);
  const resources = resourcesForWorkspaceActivity(state.navigation.module);
  return `<aside class="primary-sidebar" style="--sidebar-width:${state.workspace.sidebarWidth}px" aria-label="Primary sidebar"><div class="sidebar-header"><strong>${escapeHtml(activity?.label ?? 'Explorer')}</strong><div class="toolbar"><button class="icon-button" data-action="open-command" aria-label="Filter">${icon('search')}</button><button class="icon-button" data-action="toggle-sidebar" aria-label="Collapse sidebar">${icon('panel')}</button></div></div><div class="sidebar-search"><input type="search" placeholder="Filter resources…" aria-label="Filter resources" /></div><div class="tree-section"><div class="tree-heading">Workspace</div>${resources.map((resource) => resourceRow(resource, state)).join('') || '<div class="empty-state compact">No Resources in this activity.</div>'}</div><div class="sidebar-section"><div class="tree-heading">Saved Views</div>${state.views.saved.slice(0, 5).map((view) => `<button class="tree-row ${state.views.activeViewId === view.id ? 'is-selected' : ''}" data-saved-view="${view.id}"><span class="tree-leading">${icon(view.viewType === 'table' ? 'data' : view.resourceType === 'task' ? 'tasks' : 'documents')}</span><span class="tree-label">${escapeHtml(view.name)}</span><span class="tree-meta">${escapeHtml(view.scope)}</span></button>`).join('')}</div></aside><div class="resizer vertical" data-resizer="sidebar" role="separator" aria-label="Resize primary sidebar"></div>`;
}

export function globalBar(state) {
  const unread = unreadNotificationCount(state.notifications);
  return `<header class="global-bar"><div class="global-left"><div class="product-mark">M</div><button class="workspace-switcher">Product &amp; Research <span>⌄</span></button></div><button class="command-trigger" data-action="open-command"><span>${icon('search')}</span><span>Search, navigate, or run a command…</span><kbd>Ctrl K</kbd></button><div class="global-actions"><button class="icon-button notification-button" data-action="open-notifications" aria-label="Notifications${unread ? `, ${unread} unread` : ''}">${icon('bell')}${unread ? `<span class="notification-badge">${unread}</span>` : ''}</button><button class="icon-button" data-action="toggle-theme" aria-label="Toggle theme">${icon(state.appearance.theme === 'dark' ? 'moon' : 'sun')}</button><div class="avatar" aria-label="Account">TC</div></div></header>`;
}

export function workspaceHeader(state) {
  const resource = getResource(state.selectedResourceId) ?? getResource('project-platform-redesign');
  const canShare = hasCapability(state.permissions, 'resource.share');
  const canConfigure = hasCapability(state.permissions, 'workspace.configure');
  return `<div class="workspace-header"><div class="workspace-title"><span class="resource-icon">${icon(resource.type === 'project' ? 'projects' : 'documents')}</span><div><strong>${escapeHtml(resource.title)}</strong><span class="workspace-subtitle">${escapeHtml(resource.type)} · ${escapeHtml(resource.owner)}</span></div></div><div class="header-actions"><span class="status status-active">${escapeHtml(resource.status)}</span><div class="avatar-group"><span class="avatar small">AR</span><span class="avatar small">MK</span><span class="avatar small">JL</span></div><button class="button secondary" ${canShare ? '' : 'disabled title="Permission required: resource.share"'}>Share</button><button class="button" ${canConfigure ? '' : 'disabled'}>New</button><button class="icon-button">${icon('more')}</button></div></div>`;
}

export function breadcrumbs(state) {
  const resource = getResource(state.selectedResourceId);
  const path = resource?.path ?? ['Workspace'];
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${path.map((segment, index) => `<button>${escapeHtml(segment)}</button>${index < path.length - 1 ? '<span>/</span>' : ''}`).join('')}</nav>`;
}

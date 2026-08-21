import { createDiagnosticsSnapshot, diagnosticText } from '../platform/diagnostics.js';
import { createActivityEvent, createNotification } from '../platform/events.js';
import { createOperation, transitionOperation } from '../platform/operations.js';
import { CAPABILITIES, hasCapability } from '../platform/permissions.js';
import { platformRegistries } from '../platform/runtime.js';
import { getResource } from '../platform/resources.js';
import { parseRoute, resolveRoute, serializeRoute, shareableStateFromState } from '../platform/routing.js';
import { clearSelection, selectRange, selectSingle, toggleSelection } from '../platform/selection.js';
import { createInitialState, createStore, loadPersistedState, persistState } from '../platform/state.js';
import { createSyncMutation, updateMutationState } from '../platform/sync.js';
import { createUndoService } from '../platform/undo.js';
import { renderApp } from '../ui/templates.js';

export const root = document.querySelector('#root');
export const store = createStore(createInitialState(loadPersistedState()));
export const undoService = createUndoService({ limit: 80 });
let focusReturn = null;
let routeBound = false;

function applyIncomingRoute(route) {
  const resolved = resolveRoute(route, { getResource, registries: platformRegistries });
  if (!resolved.resource) return false;
  const effectiveRoute = { ...route, viewId: resolved.view?.id ?? route.viewId };
  store.dispatch({ type: 'route/apply', route: effectiveRoute });
  store.dispatch({ type: 'editor/open', resourceId: resolved.resource.id });
  return true;
}

const initialRoute = parseRoute(window.location.href);
if (initialRoute) applyIncomingRoute(initialRoute);

export function render() {
  const state = store.getState();
  root.innerHTML = renderApp(state);
  document.documentElement.dataset.theme = state.appearance.theme;
  document.documentElement.dataset.density = state.appearance.density;
  if (state.overlay?.type === 'command') queueMicrotask(() => root.querySelector('#command-input')?.focus());
  else if (['settings', 'recovery', 'diagnostics', 'notifications'].includes(state.overlay?.type)) queueMicrotask(() => root.querySelector('[data-overlay-content] button, [data-overlay-content] select, [data-overlay-content] input')?.focus());
  else if (state.overlay?.type === 'context') queueMicrotask(() => root.querySelector('.context-menu button')?.focus());
}

store.subscribe((state, action) => {
  persistState(state);
  if (routeBound && ['editor/open', 'editor/activate', 'view/activate'].includes(action.type)) {
    const href = serializeRoute(shareableStateFromState(state));
    const current = `${window.location.pathname}${window.location.search}`;
    if (href !== current) {
      const method = action.type === 'editor/open' ? 'pushState' : 'replaceState';
      window.history[method]({ resourceId: state.selectedResourceId }, '', href);
    }
  }
  if (!['draft/update', 'focus/set'].includes(action.type)) render();
});

export function bindRouteHistory() {
  if (routeBound) return;
  routeBound = true;
  window.addEventListener('popstate', () => {
    const route = parseRoute(window.location.href);
    if (route) applyIncomingRoute(route);
  });
  const href = serializeRoute(shareableStateFromState(store.getState()));
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') window.history.replaceState({}, '', href);
}

export function toast(title, message = '') {
  const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  store.dispatch({ type: 'toast/add', toast: { id, title, message } });
  setTimeout(() => store.dispatch({ type: 'toast/remove', id }), 3500);
}

function selectorForFocus(element) {
  if (!(element instanceof Element)) return null;
  if (element.id) return `#${CSS.escape(element.id)}`;
  for (const attribute of ['data-action', 'data-module', 'data-open-resource', 'data-activate-tab', 'data-resource-context']) {
    const value = element.getAttribute(attribute);
    if (value) return `[${attribute}="${CSS.escape(value)}"]`;
  }
  return null;
}

export function openOverlay(overlay, invoker = document.activeElement) {
  if (!store.getState().overlay) focusReturn = selectorForFocus(invoker);
  store.dispatch({ type: 'overlay/open', overlay });
}

export function closeOverlay({ restoreFocus = true } = {}) {
  const selector = focusReturn;
  focusReturn = null;
  store.dispatch({ type: 'overlay/close' });
  if (restoreFocus && selector) queueMicrotask(() => root.querySelector(selector)?.focus());
}

export function recordReversible({ label, action, inverse, mergeKey = null }) {
  undoService.record({ label, undoAction: inverse, redoAction: action, mergeKey });
  store.dispatch(action);
}

function platformContributionCount() {
  return Object.values(platformRegistries).reduce((count, registry) => count + (registry?.list?.().length ?? 0), 0);
}

export function copyDiagnostics() {
  const snapshot = createDiagnosticsSnapshot(store.getState(), { extensionCount: 0, contributionCount: platformContributionCount() });
  const text = diagnosticText(snapshot);
  const write = navigator.clipboard?.writeText?.(text);
  if (write?.then) write.then(
    () => toast('Diagnostic info copied', 'Secrets are excluded from this summary.'),
    () => toast('Diagnostic info ready', text),
  );
  else toast('Diagnostic info ready', text);
}

export function updateSelectionFromElement(element, { additive = false, range = false } = {}) {
  const scope = element?.dataset?.selectionScope;
  const id = element?.dataset?.selectItem;
  if (!scope || !id) return;
  const state = store.getState();
  const current = state.selection.scope === scope ? state.selection : clearSelection(scope);
  let selection;
  if (range) {
    const orderedIds = [...root.querySelectorAll(`[data-selection-scope="${CSS.escape(scope)}"]`)].map((row) => row.dataset.selectItem);
    selection = selectRange(current, orderedIds, id);
  } else if (additive) selection = toggleSelection(current, id);
  else selection = selectSingle(scope, id);
  store.dispatch({ type: 'selection/set', selection });
}

export function saveActiveResource() {
  const state = store.getState();
  const group = state.editors.groups.find((item) => item.id === state.editors.activeGroup);
  const resourceId = group?.active;
  if (!resourceId) return;
  if (state.connection.online) {
    store.dispatch({ type: 'draft/markSaved' });
    store.dispatch({ type: 'activity/add', event: createActivityEvent({ id: `activity-save-${Date.now()}`, type: 'resource.saved', actor: 'you', resourceId, summary: `${getResource(resourceId)?.title ?? 'Resource'} saved` }) });
    toast('Saved', 'Changes synchronized.');
    return;
  }
  const mutation = createSyncMutation({ id: `mutation-${Date.now()}`, resourceId, type: 'update', payload: { draft: state.drafts[resourceId] ?? '' }, state: 'queued' });
  store.dispatch({ type: 'sync/enqueue', mutation });
  store.dispatch({ type: 'draft/markSaved' });
  toast('Saved locally', 'The change is queued and will synchronize after reconnection.');
}

export function flushSyncQueue() {
  const state = store.getState();
  if (!state.connection.online || !state.syncQueue.length) return;
  store.dispatch({ type: 'connection/status', status: 'reconnecting' });
  store.dispatch({ type: 'connection/sync', sync: 'syncing' });
  for (const mutation of state.syncQueue) store.dispatch({ type: 'sync/update', id: mutation.id, patch: updateMutationState(mutation, 'running') });
  setTimeout(() => {
    for (const mutation of [...store.getState().syncQueue]) store.dispatch({ type: 'sync/remove', id: mutation.id });
    store.dispatch({ type: 'connection/status', status: 'online' });
    store.dispatch({ type: 'connection/sync', sync: 'synced' });
    const event = createActivityEvent({ id: `activity-sync-${Date.now()}`, type: 'workspace.synced', actor: 'system', summary: 'Queued offline changes synchronized' });
    store.dispatch({ type: 'activity/add', event });
    toast('Synchronization complete', 'Queued offline changes were confirmed.');
  }, 650);
}

export function retryFailedJobs() {
  const candidates = store.getState().jobs.filter((job) => ['failed', 'interrupted', 'partial-success', 'waiting-connection'].includes(job.state));
  if (!candidates.length) return toast('No failed jobs', 'There is nothing to retry.');
  for (const job of candidates) {
    let next;
    try { next = transitionOperation(job, 'retrying'); }
    catch { next = { ...job, state: 'retrying', attempt: (job.attempt ?? 0) + 1, updatedAt: Date.now() }; }
    store.dispatch({ type: 'job/update', id: job.id, patch: next });
    setTimeout(() => {
      const current = store.getState().jobs.find((item) => item.id === job.id);
      if (!current) return;
      let running;
      try { running = transitionOperation(current, 'running', { progress: current.progress ?? 10 }); }
      catch { running = { ...current, state: 'running' }; }
      store.dispatch({ type: 'job/update', id: job.id, patch: running });
    }, 250);
  }
  toast('Retry started', `${candidates.length} job${candidates.length === 1 ? '' : 's'} queued for retry.`);
}

export function startExportJob() {
  if (!hasCapability(store.getState().permissions, CAPABILITIES.JOB_START)) return toast('Export unavailable', 'Permission required: job.start');
  const id = `job-${Date.now()}`;
  let operation = createOperation({ id, label: 'Project export', kind: 'export', state: 'pending', progress: 0, recoverable: true });
  store.dispatch({ type: 'job/add', job: operation });
  store.dispatch({ type: 'activity/add', event: createActivityEvent({ id: `activity-${id}`, type: 'job.started', actor: 'you', summary: 'Project export started' }) });
  operation = transitionOperation(operation, 'running', { progress: 5 });
  store.dispatch({ type: 'job/update', id, patch: operation });
  toast('Export started', 'The job will continue while you work.');
  const timer = setInterval(() => {
    const current = store.getState().jobs.find((job) => job.id === id);
    if (!current || current.state !== 'running') return clearInterval(timer);
    const progress = Math.min(100, (current.progress ?? 5) + 15 + Math.round(Math.random() * 12));
    const next = transitionOperation(current, progress >= 100 ? 'success' : 'running', { progress });
    store.dispatch({ type: 'job/update', id, patch: next });
    if (progress >= 100) {
      clearInterval(timer);
      const notification = createNotification({ id: `notification-${id}`, type: 'success', title: 'Project export complete', body: 'Project archive is ready.' });
      store.dispatch({ type: 'notification/add', notification });
      store.dispatch({ type: 'activity/add', event: createActivityEvent({ id: `activity-complete-${id}`, type: 'job.completed', actor: 'system', summary: 'Project export completed' }) });
      toast('Export complete', 'Project archive is ready.');
    }
  }, 700);
}

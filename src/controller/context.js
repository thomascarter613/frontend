import { createDiagnosticsSnapshot, diagnosticText } from '../platform/diagnostics.js';
import { createOperation, transitionOperation } from '../platform/operations.js';
import { CAPABILITIES, hasCapability } from '../platform/permissions.js';
import { platformRegistries } from '../platform/runtime.js';
import { clearSelection, selectRange, selectSingle, toggleSelection } from '../platform/selection.js';
import { createInitialState, createStore, loadPersistedState, persistState } from '../platform/state.js';
import { createUndoService } from '../platform/undo.js';
import { renderApp } from '../ui/templates.js';

export const root = document.querySelector('#root');
export const store = createStore(createInitialState(loadPersistedState()));
export const undoService = createUndoService({ limit: 80 });
let focusReturn = null;

export function render() {
  const state = store.getState();
  root.innerHTML = renderApp(state);
  document.documentElement.dataset.theme = state.appearance.theme;
  document.documentElement.dataset.density = state.appearance.density;
  if (state.overlay?.type === 'command') queueMicrotask(() => root.querySelector('#command-input')?.focus());
  else if (['settings', 'recovery', 'diagnostics'].includes(state.overlay?.type)) queueMicrotask(() => root.querySelector('[data-overlay-content] button, [data-overlay-content] select, [data-overlay-content] input')?.focus());
  else if (state.overlay?.type === 'context') queueMicrotask(() => root.querySelector('.context-menu button')?.focus());
}

store.subscribe((state, action) => {
  persistState(state);
  if (!['draft/update', 'focus/set'].includes(action.type)) render();
});

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
      toast('Export complete', 'Project archive is ready.');
    }
  }, 700);
}

import { getCommand } from './platform/commands.js';
import { getResource } from './platform/resources.js';
import { createInitialState, createStore, loadPersistedState, persistState } from './platform/state.js';
import { renderApp } from './ui/templates.js';

const root = document.querySelector('#root');
const store = createStore(createInitialState(loadPersistedState()));
let dragTab = null;
let resizeSession = null;

function render() {
  const state = store.getState();
  root.innerHTML = renderApp(state);
  document.documentElement.dataset.theme = state.appearance.theme;
  document.documentElement.dataset.density = state.appearance.density;
  if (state.overlay?.type === 'command') {
    queueMicrotask(() => root.querySelector('#command-input')?.focus());
  }
}

store.subscribe((state, action) => {
  persistState(state);
  if (action.type !== 'draft/update') render();
});

function toast(title, message = '') {
  const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  store.dispatch({ type: 'toast/add', toast: { id, title, message } });
  setTimeout(() => store.dispatch({ type: 'toast/remove', id }), 3500);
}

function runCommand(commandId) {
  const command = getCommand(commandId);
  if (!command) return;
  const state = store.getState();
  const actionMap = {
    'workspace.toggleSidebar': () => store.dispatch({ type: 'workspace/toggle', region: 'sidebar' }),
    'workspace.toggleInspector': () => store.dispatch({ type: 'workspace/toggle', region: 'inspector' }),
    'workspace.toggleBottomPanel': () => store.dispatch({ type: 'workspace/toggle', region: 'bottomPanel' }),
    'editor.splitRight': () => store.dispatch({ type: 'workspace/toggle', region: 'secondaryEditor' }),
    'appearance.toggleTheme': () => store.dispatch({ type: 'appearance/theme', theme: state.appearance.theme === 'dark' ? 'light' : 'dark' }),
    'appearance.cycleDensity': () => {
      const order = ['compact', 'default', 'comfortable'];
      const next = order[(order.indexOf(state.appearance.density) + 1) % order.length];
      store.dispatch({ type: 'appearance/density', density: next });
    },
    'resource.openArchitecture': () => store.dispatch({ type: 'editor/open', resourceId: 'document-architecture' }),
    'jobs.startExport': () => startExportJob(),
    'connection.toggleOffline': () => store.dispatch({ type: 'connection/set', online: !state.connection.online }),
  };
  if (commandId.startsWith('workspace.preset.')) {
    store.dispatch({ type: 'workspace/applyPreset', preset: commandId.split('.').at(-1) });
  } else {
    actionMap[commandId]?.();
  }
  store.dispatch({ type: 'overlay/close' });
  toast(command.label);
}

function startExportJob() {
  const id = `job-${Date.now()}`;
  store.dispatch({ type: 'job/add', job: { id, title: 'Project export', state: 'running', progress: 5 } });
  toast('Export started', 'The job will continue while you work.');
  let progress = 5;
  const timer = setInterval(() => {
    progress += 15 + Math.round(Math.random() * 12);
    if (progress >= 100) {
      clearInterval(timer);
      store.dispatch({ type: 'job/update', id, patch: { state: 'success', progress: 100 } });
      toast('Export complete', 'Project archive is ready.');
    } else {
      store.dispatch({ type: 'job/update', id, patch: { progress } });
    }
  }, 700);
}

function handleAction(action) {
  switch (action) {
    case 'open-command':
      store.dispatch({ type: 'overlay/open', overlay: { type: 'command', query: '' } });
      break;
    case 'close-overlay':
      store.dispatch({ type: 'overlay/close' });
      break;
    case 'open-settings':
      store.dispatch({ type: 'overlay/open', overlay: { type: 'settings' } });
      break;
    case 'toggle-sidebar':
      store.dispatch({ type: 'workspace/toggle', region: 'sidebar' });
      break;
    case 'toggle-inspector':
      store.dispatch({ type: 'workspace/toggle', region: 'inspector' });
      break;
    case 'toggle-bottom-panel':
      store.dispatch({ type: 'workspace/toggle', region: 'bottomPanel' });
      break;
    case 'toggle-theme':
      runCommand('appearance.toggleTheme');
      break;
    case 'start-export':
      startExportJob();
      break;
    case 'toggle-offline': {
      const online = !store.getState().connection.online;
      store.dispatch({ type: 'connection/set', online });
      toast(online ? 'Connection restored' : 'Offline mode', online ? 'Local changes can synchronize again.' : 'Edits will be preserved locally.');
      break;
    }
    default:
      break;
  }
}

root.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    if (actionTarget.matches('.overlay-backdrop') && event.target !== actionTarget) return;
    handleAction(actionTarget.dataset.action);
    return;
  }

  const moduleTarget = event.target.closest('[data-module]');
  if (moduleTarget) {
    store.dispatch({ type: 'navigation/setModule', module: moduleTarget.dataset.module });
    return;
  }

  const openTarget = event.target.closest('[data-open-resource]');
  if (openTarget) {
    const resourceId = openTarget.dataset.openResource;
    if (getResource(resourceId)) store.dispatch({ type: 'editor/open', resourceId });
    store.dispatch({ type: 'overlay/close' });
    return;
  }

  const activate = event.target.closest('[data-activate-tab]');
  if (activate) {
    store.dispatch({ type: 'editor/activate', groupId: activate.dataset.groupId, resourceId: activate.dataset.activateTab });
    return;
  }

  const close = event.target.closest('[data-close-tab]');
  if (close) {
    event.stopPropagation();
    store.dispatch({ type: 'editor/close', groupId: close.dataset.groupId, resourceId: close.dataset.closeTab });
    return;
  }

  const inspectorTab = event.target.closest('[data-inspector-tab]');
  if (inspectorTab) {
    store.dispatch({ type: 'workspace/setTab', region: 'inspectorTab', tab: inspectorTab.dataset.inspectorTab });
    return;
  }

  const bottomTab = event.target.closest('[data-bottom-tab]');
  if (bottomTab) {
    store.dispatch({ type: 'workspace/setTab', region: 'bottomPanelTab', tab: bottomTab.dataset.bottomTab });
    return;
  }

  const preset = event.target.closest('[data-preset]');
  if (preset) {
    store.dispatch({ type: 'workspace/applyPreset', preset: preset.dataset.preset });
    return;
  }

  const command = event.target.closest('[data-run-command]');
  if (command) {
    runCommand(command.dataset.runCommand);
    return;
  }

  const dismissToast = event.target.closest('[data-dismiss-toast]');
  if (dismissToast) {
    store.dispatch({ type: 'toast/remove', id: dismissToast.dataset.dismissToast });
    return;
  }

  const side = event.target.closest('[data-context-action="side"]');
  if (side) {
    const resourceId = store.getState().overlay?.resourceId;
    if (resourceId) {
      store.dispatch({ type: 'workspace/setSize', key: 'secondaryEditor', value: true });
      store.dispatch({ type: 'editor/open', resourceId, groupId: 'group-b' });
    }
    store.dispatch({ type: 'overlay/close' });
  }
});

root.addEventListener('input', (event) => {
  const editor = event.target.closest('[data-document-editor]');
  if (editor) {
    store.dispatch({ type: 'draft/update', resourceId: editor.dataset.documentEditor, value: editor.value });
    const activeTab = root.querySelector(`[data-tab-resource="${editor.dataset.documentEditor}"]`);
    if (activeTab && !activeTab.querySelector('.modified-dot')) {
      activeTab.querySelector('.tab-main')?.insertAdjacentHTML('beforeend', '<span class="modified-dot" aria-label="Modified"></span>');
    }
    return;
  }
  if (event.target.matches('[data-command-input]')) {
    store.dispatch({ type: 'overlay/open', overlay: { type: 'command', query: event.target.value } });
  }
});

root.addEventListener('change', (event) => {
  if (!event.target.matches('[data-setting]')) return;
  if (event.target.dataset.setting === 'theme') store.dispatch({ type: 'appearance/theme', theme: event.target.value });
  if (event.target.dataset.setting === 'density') store.dispatch({ type: 'appearance/density', density: event.target.value });
});

root.addEventListener('contextmenu', (event) => {
  const resourceTarget = event.target.closest('[data-resource-context]');
  if (!resourceTarget) return;
  event.preventDefault();
  store.dispatch({ type: 'overlay/open', overlay: { type: 'context', resourceId: resourceTarget.dataset.resourceContext, x: event.clientX, y: event.clientY } });
});

root.addEventListener('dragstart', (event) => {
  const tab = event.target.closest('[data-tab-resource]');
  if (!tab) return;
  dragTab = { resourceId: tab.dataset.tabResource, fromGroupId: tab.dataset.groupId };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', dragTab.resourceId);
});

root.addEventListener('dragover', (event) => {
  if (dragTab && event.target.closest('[data-editor-group]')) event.preventDefault();
});

root.addEventListener('drop', (event) => {
  const group = event.target.closest('[data-editor-group]');
  if (!group || !dragTab) return;
  event.preventDefault();
  store.dispatch({ type: 'editor/move', ...dragTab, toGroupId: group.dataset.editorGroup });
  dragTab = null;
});

root.addEventListener('pointerdown', (event) => {
  const handle = event.target.closest('[data-resizer]');
  if (!handle) return;
  const state = store.getState();
  resizeSession = {
    type: handle.dataset.resizer,
    x: event.clientX,
    y: event.clientY,
    sidebarWidth: state.workspace.sidebarWidth,
    inspectorWidth: state.workspace.inspectorWidth,
    bottomPanelHeight: state.workspace.bottomPanelHeight,
    editorSplit: state.workspace.editorSplit,
  };
  handle.setPointerCapture?.(event.pointerId);
  document.body.classList.add('is-resizing');
});

window.addEventListener('pointermove', (event) => {
  if (!resizeSession) return;
  const dx = event.clientX - resizeSession.x;
  const dy = event.clientY - resizeSession.y;
  if (resizeSession.type === 'sidebar') {
    store.dispatch({ type: 'workspace/setSize', key: 'sidebarWidth', value: Math.max(210, Math.min(420, resizeSession.sidebarWidth + dx)) });
  }
  if (resizeSession.type === 'inspector') {
    store.dispatch({ type: 'workspace/setSize', key: 'inspectorWidth', value: Math.max(240, Math.min(480, resizeSession.inspectorWidth - dx)) });
  }
  if (resizeSession.type === 'bottom') {
    store.dispatch({ type: 'workspace/setSize', key: 'bottomPanelHeight', value: Math.max(120, Math.min(420, resizeSession.bottomPanelHeight - dy)) });
  }
  if (resizeSession.type === 'editor') {
    const grid = root.querySelector('.editor-grid');
    const width = grid?.clientWidth ?? 1000;
    store.dispatch({ type: 'workspace/setSize', key: 'editorSplit', value: Math.max(30, Math.min(75, resizeSession.editorSplit + (dx / width) * 100)) });
  }
});

window.addEventListener('pointerup', () => {
  resizeSession = null;
  document.body.classList.remove('is-resizing');
});

window.addEventListener('keydown', (event) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    store.dispatch({ type: 'overlay/open', overlay: { type: 'command', query: '' } });
    return;
  }
  if (mod && event.key.toLowerCase() === 'b') {
    event.preventDefault();
    runCommand('workspace.toggleSidebar');
    return;
  }
  if (mod && event.key === '\\') {
    event.preventDefault();
    runCommand('editor.splitRight');
    return;
  }
  if (mod && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    runCommand('workspace.toggleBottomPanel');
    return;
  }
  if (mod && event.key.toLowerCase() === 's') {
    event.preventDefault();
    store.dispatch({ type: 'draft/markSaved' });
    toast('Saved', store.getState().connection.online ? 'Changes synchronized.' : 'Changes preserved locally until reconnection.');
    return;
  }
  if (event.key === 'Escape') {
    const state = store.getState();
    if (state.overlay) store.dispatch({ type: 'overlay/close' });
    else if (state.workspace.preset === 'zen') store.dispatch({ type: 'workspace/applyPreset', preset: 'maximum' });
  }
});

window.addEventListener('online', () => store.dispatch({ type: 'connection/set', online: true }));
window.addEventListener('offline', () => store.dispatch({ type: 'connection/set', online: false }));

render();

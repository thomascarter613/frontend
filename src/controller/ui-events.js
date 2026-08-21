import { getResource, listResources } from '../platform/resources.js';
import { CAPABILITIES, hasCapability } from '../platform/permissions.js';
import { closeOverlay, copyDiagnostics, flushSyncQueue, openOverlay, retryFailedJobs, root, startExportJob, store, toast, updateSelectionFromElement } from './context.js';
import { runCommand } from './commands.js';

export function bindUiEvents() {
  root.addEventListener('click', (event) => {
    const overlayContent = event.target.closest('[data-overlay-content]');
    if (overlayContent && event.target.closest('[data-action="close-overlay"]')?.matches('.overlay-backdrop')) return;

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      if (actionTarget.matches('.overlay-backdrop') && event.target !== actionTarget) return;
      const action = actionTarget.dataset.action;
      const actions = {
        'open-command': () => openOverlay({ type: 'command', query: '' }, actionTarget),
        'close-overlay': () => closeOverlay(),
        'open-settings': () => openOverlay({ type: 'settings' }, actionTarget),
        'open-notifications': () => openOverlay({ type: 'notifications' }, actionTarget),
        'open-recovery': () => openOverlay({ type: 'recovery' }, actionTarget),
        'open-diagnostics': () => openOverlay({ type: 'diagnostics' }, actionTarget),
        'copy-diagnostics': copyDiagnostics,
        'retry-failed-jobs': retryFailedJobs,
        'save-recovery-drafts': () => { store.dispatch({ type: 'draft/markSaved' }); toast('Recovered drafts marked saved', 'Recovery entries were resolved without discarding draft content.'); },
        'toggle-sidebar': () => runCommand('workspace.toggleSidebar'),
        'toggle-inspector': () => runCommand('workspace.toggleInspector'),
        'toggle-bottom-panel': () => runCommand('workspace.toggleBottomPanel'),
        'toggle-theme': () => runCommand('appearance.toggleTheme'),
        'start-export': startExportJob,
        'toggle-offline': () => { const online = !store.getState().connection.online; store.dispatch({ type: 'connection/set', online }); toast(online ? 'Connection restored' : 'Offline mode', online ? 'Local changes can synchronize again.' : 'Edits will be preserved locally.'); if (online) flushSyncQueue(); },
      };
      actions[action]?.();
      return;
    }

    const notificationTarget = event.target.closest('[data-notification-id]');
    if (notificationTarget) {
      store.dispatch({ type: 'notification/read', id: notificationTarget.dataset.notificationId });
      const resourceId = notificationTarget.dataset.openResource;
      if (resourceId && getResource(resourceId)) store.dispatch({ type: 'editor/open', resourceId });
      closeOverlay({ restoreFocus: false });
      return;
    }
    const savedViewTarget = event.target.closest('[data-saved-view]');
    if (savedViewTarget) {
      const view = store.getState().views.saved.find((item) => item.id === savedViewTarget.dataset.savedView);
      if (!view) return;
      store.dispatch({ type: 'view/activate', viewId: view.id, viewType: `view.${view.viewType}`, filter: view.filters });
      const compatible = listResources().find((resource) => resource.type === view.resourceType);
      if (compatible) store.dispatch({ type: 'editor/open', resourceId: compatible.id });
      return;
    }
    const selectionTarget = event.target.closest('[data-select-item]');
    if (selectionTarget) return updateSelectionFromElement(selectionTarget, { additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
    const moduleTarget = event.target.closest('[data-module]');
    if (moduleTarget) return store.dispatch({ type: 'navigation/setModule', module: moduleTarget.dataset.module });
    const openTarget = event.target.closest('[data-open-resource]');
    if (openTarget) {
      const resourceId = openTarget.dataset.openResource;
      if (getResource(resourceId)) store.dispatch({ type: 'editor/open', resourceId });
      if (store.getState().overlay) closeOverlay({ restoreFocus: false });
      return;
    }
    const activate = event.target.closest('[data-activate-tab]');
    if (activate) return store.dispatch({ type: 'editor/activate', groupId: activate.dataset.groupId, resourceId: activate.dataset.activateTab });
    const close = event.target.closest('[data-close-tab]');
    if (close) { event.stopPropagation(); return store.dispatch({ type: 'editor/close', groupId: close.dataset.groupId, resourceId: close.dataset.closeTab }); }
    const inspectorTab = event.target.closest('[data-inspector-tab]');
    if (inspectorTab) return store.dispatch({ type: 'workspace/setTab', region: 'inspectorTab', tab: inspectorTab.dataset.inspectorTab });
    const bottomTab = event.target.closest('[data-bottom-tab]');
    if (bottomTab) return store.dispatch({ type: 'workspace/setTab', region: 'bottomPanelTab', tab: bottomTab.dataset.bottomTab });
    const preset = event.target.closest('[data-preset]');
    if (preset) return store.dispatch({ type: 'workspace/applyPreset', preset: preset.dataset.preset });
    const command = event.target.closest('[data-run-command]');
    if (command) return runCommand(command.dataset.runCommand);
    const dismissToast = event.target.closest('[data-dismiss-toast]');
    if (dismissToast) return store.dispatch({ type: 'toast/remove', id: dismissToast.dataset.dismissToast });
    const side = event.target.closest('[data-context-action="side"]');
    if (side) {
      const state = store.getState();
      const resourceId = state.overlay?.resourceId;
      if (resourceId) {
        const targetGroup = state.editors.groups.find((group) => group.id !== state.editors.activeGroup);
        if (targetGroup) store.dispatch({ type: 'editor/open', resourceId, groupId: targetGroup.id });
        else store.dispatch({ type: 'editor/split', groupId: state.editors.activeGroup, orientation: 'vertical', resourceId });
      }
      closeOverlay({ restoreFocus: false });
    }
  });

  root.addEventListener('input', (event) => {
    const editor = event.target.closest('[data-document-editor]');
    if (editor) {
      if (!hasCapability(store.getState().permissions, CAPABILITIES.RESOURCE_UPDATE)) return;
      store.dispatch({ type: 'draft/update', resourceId: editor.dataset.documentEditor, value: editor.value });
      const activeTab = root.querySelector(`[data-tab-resource="${editor.dataset.documentEditor}"]`);
      if (activeTab && !activeTab.querySelector('.modified-dot')) activeTab.querySelector('.tab-main')?.insertAdjacentHTML('beforeend', '<span class="modified-dot" aria-label="Modified"></span>');
      return;
    }
    if (event.target.matches('[data-command-input]')) store.dispatch({ type: 'overlay/open', overlay: { type: 'command', query: event.target.value } });
  });

  root.addEventListener('change', (event) => {
    if (!event.target.matches('[data-setting]')) return;
    if (event.target.dataset.setting === 'theme') store.dispatch({ type: 'appearance/theme', theme: event.target.value });
    if (event.target.dataset.setting === 'density') store.dispatch({ type: 'appearance/density', density: event.target.value });
  });

  root.addEventListener('focusin', (event) => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element) return;
    const region = element.closest('[data-overlay-content]') ? 'overlay' : element.closest('[data-editor-group]') ? 'editor' : element.closest('.primary-sidebar') ? 'sidebar' : element.closest('.activity-rail') ? 'activity-rail' : element.closest('.inspector') ? 'inspector' : element.closest('.bottom-panel') ? 'bottom-panel' : element.closest('.global-bar') ? 'global-bar' : null;
    const id = element.id || element.dataset.selectItem || element.dataset.openResource || element.dataset.activateTab || element.getAttribute('aria-label') || null;
    store.dispatch({ type: 'focus/set', region, id });
  });

  root.addEventListener('keydown', (event) => {
    const state = store.getState();
    if (event.key === 'Tab' && ['command', 'settings', 'recovery', 'diagnostics', 'notifications'].includes(state.overlay?.type)) {
      const container = root.querySelector('[data-overlay-content]');
      const focusable = [...(container?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (focusable.length) {
        const index = focusable.indexOf(document.activeElement);
        const next = event.shiftKey ? (index <= 0 ? focusable.length - 1 : index - 1) : (index >= focusable.length - 1 ? 0 : index + 1);
        event.preventDefault();
        focusable[next].focus();
        return;
      }
    }
    const row = event.target.closest?.('[data-select-item]');
    if (!row) return;
    const rows = [...root.querySelectorAll(`[data-selection-scope="${CSS.escape(row.dataset.selectionScope)}"]`)];
    const index = rows.indexOf(row);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      rows[Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus();
    } else if (event.key === ' ') {
      event.preventDefault();
      updateSelectionFromElement(row, { additive: event.metaKey || event.ctrlKey, range: event.shiftKey });
    }
  });

  root.addEventListener('contextmenu', (event) => {
    const target = event.target.closest('[data-resource-context]');
    if (!target) return;
    event.preventDefault();
    openOverlay({ type: 'context', resourceId: target.dataset.resourceContext, x: event.clientX, y: event.clientY }, target);
  });
}

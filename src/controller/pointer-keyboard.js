import { findSplit } from '../platform/state.js';
import { closeOverlay, flushSyncQueue, openOverlay, root, saveActiveResource, store } from './context.js';
import { runCommand } from './commands.js';

export function bindPointerKeyboardEvents() {
  let dragTab = null;
  let resizeSession = null;

  root.addEventListener('dragstart', (event) => {
    const tab = event.target.closest('[data-tab-resource]');
    if (!tab) return;
    dragTab = { resourceId: tab.dataset.tabResource, fromGroupId: tab.dataset.groupId };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dragTab.resourceId);
  });
  root.addEventListener('dragover', (event) => { if (dragTab && event.target.closest('[data-editor-group]')) event.preventDefault(); });
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
    const split = handle.dataset.splitId ? findSplit(state.editors.layout, handle.dataset.splitId) : null;
    resizeSession = { type: handle.dataset.resizer, x: event.clientX, y: event.clientY, sidebarWidth: state.workspace.sidebarWidth, inspectorWidth: state.workspace.inspectorWidth, bottomPanelHeight: state.workspace.bottomPanelHeight, editorSplit: state.workspace.editorSplit, splitId: handle.dataset.splitId ?? null, orientation: handle.dataset.orientation ?? null, splitRatio: split?.ratio ?? null, splitElement: handle.parentElement };
    handle.setPointerCapture?.(event.pointerId);
    document.body.classList.add('is-resizing');
  });

  window.addEventListener('pointermove', (event) => {
    if (!resizeSession) return;
    const dx = event.clientX - resizeSession.x;
    const dy = event.clientY - resizeSession.y;
    if (resizeSession.type === 'sidebar') store.dispatch({ type: 'workspace/setSize', key: 'sidebarWidth', value: Math.max(210, Math.min(420, resizeSession.sidebarWidth + dx)) });
    if (resizeSession.type === 'inspector') store.dispatch({ type: 'workspace/setSize', key: 'inspectorWidth', value: Math.max(240, Math.min(480, resizeSession.inspectorWidth - dx)) });
    if (resizeSession.type === 'bottom') store.dispatch({ type: 'workspace/setSize', key: 'bottomPanelHeight', value: Math.max(120, Math.min(420, resizeSession.bottomPanelHeight - dy)) });
    if (resizeSession.type === 'editor-split' && resizeSession.splitId) {
      const rect = resizeSession.splitElement?.getBoundingClientRect();
      const span = resizeSession.orientation === 'horizontal' ? rect?.height : rect?.width;
      const delta = resizeSession.orientation === 'horizontal' ? dy : dx;
      if (span) store.dispatch({ type: 'editor/setSplitRatio', splitId: resizeSession.splitId, ratio: resizeSession.splitRatio + delta / span });
    }
    if (resizeSession.type === 'editor') {
      const width = root.querySelector('.editor-grid')?.clientWidth ?? 1000;
      store.dispatch({ type: 'workspace/setSize', key: 'editorSplit', value: Math.max(30, Math.min(75, resizeSession.editorSplit + (dx / width) * 100)) });
    }
  });
  window.addEventListener('pointerup', () => { resizeSession = null; document.body.classList.remove('is-resizing'); });

  window.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const editable = event.target instanceof HTMLElement && event.target.matches('textarea, input, [contenteditable="true"]');
    if (mod && key === 'k') { event.preventDefault(); openOverlay({ type: 'command', query: '' }, document.activeElement); return; }
    if (mod && key === 'z' && !editable) { event.preventDefault(); runCommand(event.shiftKey ? 'history.redo' : 'history.undo'); return; }
    if (mod && key === 'y' && !editable) { event.preventDefault(); runCommand('history.redo'); return; }
    if (mod && key === 'b') { event.preventDefault(); runCommand('workspace.toggleSidebar'); return; }
    if (mod && event.key === '\\') { event.preventDefault(); runCommand('editor.splitRight'); return; }
    if (mod && key === 'j') { event.preventDefault(); runCommand('workspace.toggleBottomPanel'); return; }
    if (mod && key === 's') { event.preventDefault(); saveActiveResource(); return; }
    if (event.key === 'Escape') {
      const state = store.getState();
      if (dragTab) { dragTab = null; event.preventDefault(); return; }
      if (resizeSession) { resizeSession = null; document.body.classList.remove('is-resizing'); event.preventDefault(); return; }
      if (state.overlay) { event.preventDefault(); closeOverlay(); return; }
      if (state.selection.mode !== 'none') { event.preventDefault(); store.dispatch({ type: 'selection/clear', scope: state.selection.scope }); return; }
      if (state.workspace.preset === 'zen') { event.preventDefault(); store.dispatch({ type: 'workspace/applyPreset', preset: 'maximum' }); }
    }
  });

  window.addEventListener('online', () => { store.dispatch({ type: 'connection/set', online: true }); flushSyncQueue(); });
  window.addEventListener('offline', () => store.dispatch({ type: 'connection/set', online: false }));
}

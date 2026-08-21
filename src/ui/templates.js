import { activityRail, breadcrumbs, globalBar, sidebar, workspaceHeader } from './shell.js';
import { editorGrid } from './editor.js';
import { bottomPanel, inspector, statusBar } from './panels.js';
import { commandPalette, contextMenu, diagnosticsCenter, notificationCenter, recoveryCenter, settingsDialog, toastStack } from './overlays.js';

export function renderApp(state) {
  return `<div class="app-shell" data-theme="${state.appearance.theme}" data-density="${state.appearance.density}">
    ${globalBar(state)}
    <div class="workspace-body">
      ${activityRail(state)}
      ${sidebar(state)}
      <main class="main-workspace">
        ${workspaceHeader(state)}
        ${breadcrumbs(state)}
        <div class="editor-and-panel">${editorGrid(state)}${bottomPanel(state)}</div>
      </main>
      ${inspector(state)}
    </div>
    ${statusBar(state)}
    <div class="overlay-layer">${commandPalette(state)}${settingsDialog(state)}${recoveryCenter(state)}${diagnosticsCenter(state)}${notificationCenter(state)}${contextMenu(state)}</div>
    ${toastStack(state)}
  </div>`;
}

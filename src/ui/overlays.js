import { COMMANDS } from '../platform/commands.js';
import { hasCapability } from '../platform/permissions.js';
import { WORKSPACE_PRESETS } from '../workspace/presets.js';
import { icon } from './icons.js';
import { escapeHtml } from './html.js';

export function commandPalette(state) {
  if (state.overlay?.type !== 'command') return '';
  const query = state.overlay.query ?? '';
  const visible = COMMANDS.filter((command) => `${command.label} ${command.id}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  return `<div class="overlay-backdrop" data-action="close-overlay"><section class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" data-overlay-content><div class="command-input-wrap">${icon('command')}<input id="command-input" data-command-input value="${escapeHtml(query)}" placeholder="Type a command or search…" autofocus /><kbd>Esc</kbd></div><div class="command-section-label">Commands</div><div class="command-results">${visible.map((command, index) => { const allowed = !command.capability || hasCapability(state.permissions, command.capability); return `<button class="command-row ${index === 0 ? 'is-selected' : ''}" data-run-command="${command.id}" ${allowed ? '' : 'disabled'}><span>${escapeHtml(command.label)}${allowed ? '' : ' · unavailable'}</span><kbd>${escapeHtml(command.shortcut ?? '')}</kbd></button>`; }).join('') || '<div class="empty-state compact">No commands found</div>'}</div></section></div>`;
}

export function settingsDialog(state) {
  if (state.overlay?.type !== 'settings') return '';
  return `<div class="overlay-backdrop" data-action="close-overlay"><section class="settings-dialog" role="dialog" aria-modal="true" aria-label="Workspace settings" data-overlay-content><div class="dialog-header"><div><span class="surface-eyebrow">PREFERENCES</span><h2>Workspace settings</h2></div><button class="icon-button" data-action="close-overlay">${icon('close')}</button></div><div class="settings-grid"><label>Theme<select data-setting="theme"><option value="dark" ${state.appearance.theme === 'dark' ? 'selected' : ''}>Dark</option><option value="light" ${state.appearance.theme === 'light' ? 'selected' : ''}>Light</option></select></label><label>Density<select data-setting="density"><option value="compact" ${state.appearance.density === 'compact' ? 'selected' : ''}>Compact</option><option value="default" ${state.appearance.density === 'default' ? 'selected' : ''}>Default</option><option value="comfortable" ${state.appearance.density === 'comfortable' ? 'selected' : ''}>Comfortable</option></select></label></div><div class="preset-list"><span>Workspace preset</span>${Object.values(WORKSPACE_PRESETS).map((preset) => `<button class="${state.workspace.preset === preset.id ? 'is-active' : ''}" data-preset="${preset.id}">${preset.label}</button>`).join('')}</div></section></div>`;
}

export function contextMenu(state) {
  if (state.overlay?.type !== 'context') return '';
  return `<div class="context-menu" data-overlay-content style="left:${state.overlay.x}px;top:${state.overlay.y}px" role="menu"><button data-open-resource="${state.overlay.resourceId}">Open</button><button data-context-action="side">Open to the Side</button><button>Copy Link</button><hr/><button>Add to Favorites</button><button>Rename</button><hr/><button class="danger">Delete</button></div>`;
}

export function toastStack(state) {
  return `<div class="toast-stack" aria-live="polite">${state.toasts.map((toast) => `<div class="toast"><div><strong>${escapeHtml(toast.title)}</strong><span>${escapeHtml(toast.message ?? '')}</span></div><button class="icon-button" data-dismiss-toast="${toast.id}">${icon('close')}</button></div>`).join('')}</div>`;
}

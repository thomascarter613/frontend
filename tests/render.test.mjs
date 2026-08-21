import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reducer } from '../src/platform/state.js';
import { renderApp } from '../src/ui/templates.js';


test('maximum workspace render contains persistent shell regions', () => {
  const html = renderApp(createInitialState());
  for (const marker of ['global-bar', 'activity-rail', 'primary-sidebar', 'editor-grid', 'inspector', 'bottom-panel', 'status-bar']) {
    assert.match(html, new RegExp(marker));
  }
});

test('command palette renders as overlay without replacing the shell', () => {
  const state = reducer(createInitialState(), { type: 'overlay/open', overlay: { type: 'command', query: '' } });
  const html = renderApp(state);
  assert.match(html, /command-palette/);
  assert.match(html, /editor-grid/);
});


test('recovery and diagnostics render as bounded overlays over the persistent workspace', () => {
  let state = reducer(createInitialState({ drafts: { 'document-architecture': 'recovered' } }), { type: 'overlay/open', overlay: { type: 'recovery' } });
  let html = renderApp(state);
  assert.match(html, /Recovery Center/);
  assert.match(html, /editor-grid/);
  state = reducer(state, { type: 'overlay/open', overlay: { type: 'diagnostics' } });
  html = renderApp(state);
  assert.match(html, /Workspace diagnostics/);
  assert.match(html, /editor-grid/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMANDS, getCommand, searchCommands } from '../src/platform/commands.js';


test('command IDs are unique and stable-looking', () => {
  const ids = COMMANDS.map((command) => command.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z]+\.[A-Za-z0-9.]+$/.test(id)));
});

test('command lookup resolves user intent independently of invocation surface', () => {
  const command = getCommand('workspace.toggleSidebar');
  assert.equal(command?.label, 'Toggle Primary Sidebar');
});

test('command search matches labels and IDs', () => {
  assert.ok(searchCommands('theme').some((command) => command.id === 'appearance.toggleTheme'));
  assert.ok(searchCommands('sidebar').some((command) => command.id === 'workspace.toggleSidebar'));
});

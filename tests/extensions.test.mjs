import test from 'node:test';
import assert from 'node:assert/strict';
import { createExtensionHost } from '../src/platform/extensions.js';
import { createPlatformRegistries } from '../src/platform/registries.js';
import { CAPABILITIES, createCapabilityPolicy } from '../src/platform/permissions.js';

test('extension contributions flow through bounded platform registries', () => {
  const registries = createPlatformRegistries();
  const host = createExtensionHost(registries, createCapabilityPolicy({ allow: [CAPABILITIES.EXTENSION_INSTALL, CAPABILITIES.EXTENSION_MANAGE] }));
  const result = host.install({
    id: 'acme.schema',
    version: '1.0.0',
    contributions: {
      fields: [{ id: 'risk', label: 'Risk', valueType: 'string' }],
      inspectorSections: [{ id: 'risk-panel', label: 'Risk Analysis' }],
      commands: [{ id: 'review-risk', label: 'Review Risk' }],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(registries.fields.has('acme.schema.risk'), true);
  assert.equal(registries.inspectorSections.has('acme.schema.risk-panel'), true);
  assert.equal(registries.commands.sourceOf('acme.schema.review-risk'), 'acme.schema');
});

test('unsupported extension contribution point fails atomically', () => {
  const registries = createPlatformRegistries();
  const host = createExtensionHost(registries, createCapabilityPolicy({ allow: [CAPABILITIES.EXTENSION_INSTALL] }));
  const before = registries.fields.list().length;
  const result = host.install({
    id: 'bad.extension',
    version: '1.0.0',
    contributions: {
      fields: [{ id: 'temporary', label: 'Temporary' }],
      iframeApplications: [{ id: 'escape-hatch', label: 'Disconnected App' }],
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.category, 'extension');
  assert.equal(registries.fields.list().length, before);
});

test('extension installation requires a capability rather than a role name', () => {
  const registries = createPlatformRegistries();
  const host = createExtensionHost(registries, createCapabilityPolicy({ allow: [] }));
  const result = host.install({ id: 'acme.denied', version: '1.0.0' });
  assert.equal(result.ok, false);
  assert.equal(result.error.category, 'permission');
});

test('built-in view registry resolves canonical resource representations', async () => {
  const { resolveResourceView } = await import('../src/platform/runtime.js');
  const view = resolveResourceView({ id: 'doc-x', type: 'document' });
  assert.equal(view?.id, 'view.document');
});

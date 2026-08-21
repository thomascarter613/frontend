import { createPlatformError, err, ok } from './errors.js';
import { hasCapability, CAPABILITIES } from './permissions.js';

export const CONTRIBUTION_POINTS = Object.freeze({
  views: 'views',
  editors: 'editors',
  fields: 'fields',
  actions: 'actions',
  commands: 'commands',
  inspectorSections: 'inspectorSections',
  panels: 'panels',
});

function normalizedContributionId(extensionId, id) {
  return id.startsWith(`${extensionId}.`) ? id : `${extensionId}.${id}`;
}

export function createExtensionHost(registries, policy) {
  const installed = new Map();

  function install(manifest) {
    if (!hasCapability(policy, CAPABILITIES.EXTENSION_INSTALL)) {
      return err(createPlatformError({
        code: 'extension.permission_denied',
        category: 'permission',
        message: 'Extension installation is not permitted in this workspace.',
      }));
    }
    if (!manifest?.id || !manifest?.version) {
      return err(createPlatformError({
        code: 'extension.invalid_manifest',
        category: 'extension',
        message: 'Extension manifest requires id and version.',
      }));
    }
    if (installed.has(manifest.id)) {
      return err(createPlatformError({
        code: 'extension.already_installed',
        category: 'extension',
        message: `Extension ${manifest.id} is already installed.`,
      }));
    }

    const registered = [];
    try {
      for (const [point, contributions] of Object.entries(manifest.contributions ?? {})) {
        const registryName = CONTRIBUTION_POINTS[point];
        if (!registryName || !registries[registryName]) throw new Error(`Unsupported contribution point: ${point}`);
        for (const contribution of contributions ?? []) {
          const entry = { ...contribution, id: normalizedContributionId(manifest.id, contribution.id) };
          registries[registryName].register(entry, manifest.id);
          registered.push([registryName, entry.id]);
        }
      }
      const record = Object.freeze({ id: manifest.id, version: manifest.version, name: manifest.name ?? manifest.id, enabled: true });
      installed.set(manifest.id, record);
      return ok(record);
    } catch (cause) {
      registered.reverse().forEach(([registryName, id]) => registries[registryName].unregister(id, manifest.id));
      return err(createPlatformError({
        code: 'extension.install_failed',
        category: 'extension',
        message: `Extension ${manifest.id} could not be installed.`,
        recoverable: true,
        details: { reason: cause.message },
      }));
    }
  }

  function uninstall(extensionId) {
    if (!hasCapability(policy, CAPABILITIES.EXTENSION_MANAGE)) {
      return err(createPlatformError({
        code: 'extension.permission_denied',
        category: 'permission',
        message: 'Extension management is not permitted in this workspace.',
      }));
    }
    for (const registryName of Object.values(CONTRIBUTION_POINTS)) {
      const registry = registries[registryName];
      registry.list().forEach((entry) => registry.unregister(entry.id, extensionId));
    }
    const removed = installed.delete(extensionId);
    return ok(removed);
  }

  return Object.freeze({ install, uninstall, list: () => [...installed.values()] });
}

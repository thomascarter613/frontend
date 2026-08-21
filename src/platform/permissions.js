export const CAPABILITIES = Object.freeze({
  RESOURCE_READ: 'resource.read',
  RESOURCE_UPDATE: 'resource.update',
  RESOURCE_SHARE: 'resource.share',
  RESOURCE_DELETE: 'resource.delete',
  EDITOR_SPLIT: 'editor.split',
  WORKSPACE_CONFIGURE: 'workspace.configure',
  JOB_START: 'job.start',
  EXTENSION_INSTALL: 'extension.install',
  EXTENSION_MANAGE: 'extension.manage',
});

export const DEFAULT_CAPABILITIES = Object.freeze([
  CAPABILITIES.RESOURCE_READ,
  CAPABILITIES.RESOURCE_UPDATE,
  CAPABILITIES.RESOURCE_SHARE,
  CAPABILITIES.EDITOR_SPLIT,
  CAPABILITIES.WORKSPACE_CONFIGURE,
  CAPABILITIES.JOB_START,
  CAPABILITIES.EXTENSION_INSTALL,
  CAPABILITIES.EXTENSION_MANAGE,
]);

export function createCapabilityPolicy({ allow = DEFAULT_CAPABILITIES, deny = [] } = {}) {
  return { allow: [...new Set(allow)], deny: [...new Set(deny)] };
}

export function hasCapability(policy, capability) {
  const deny = new Set(policy?.deny ?? []);
  const allow = new Set(policy?.allow ?? []);
  if (deny.has('*') || deny.has(capability)) return false;
  return allow.has('*') || allow.has(capability);
}

export function withCapability(policy, capability, enabled) {
  const allow = new Set(policy?.allow ?? []);
  const deny = new Set(policy?.deny ?? []);
  if (enabled) {
    deny.delete(capability);
    allow.add(capability);
  } else {
    allow.delete(capability);
    deny.add(capability);
  }
  return { allow: [...allow], deny: [...deny] };
}

import { COMMANDS } from './commands.js';
import { createPlatformRegistries, resolveView } from './registries.js';

export const platformRegistries = createPlatformRegistries();

for (const command of COMMANDS) {
  platformRegistries.commands.register(command, 'core');
}

export function resolveResourceView(resource) {
  return resolveView(platformRegistries, resource);
}

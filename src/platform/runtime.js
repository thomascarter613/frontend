import { COMMANDS } from './commands.js';
import { createInstrumentationHub } from './instrumentation.js';
import { createPlatformRegistries, resolveView } from './registries.js';

export const platformRegistries = createPlatformRegistries();
export const platformInstrumentation = createInstrumentationHub({ limit: 100 });

for (const command of COMMANDS) {
  platformRegistries.commands.register(command, 'core');
}

export function resolveResourceView(resource) {
  return resolveView(platformRegistries, resource);
}

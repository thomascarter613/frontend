import { COMMANDS } from './commands.js';
import { createInstrumentationHub } from './instrumentation.js';
import { BUILTIN_FEATURE_MODULES, PLATFORM_ACTIVITIES, createFeatureModuleHost } from './modules.js';
import { createPlatformRegistries, resolveView } from './registries.js';
import { getResource, resourcesForModule } from './resources.js';

export const platformRegistries = createPlatformRegistries();
export const platformInstrumentation = createInstrumentationHub({ limit: 100 });
export const featureModules = createFeatureModuleHost({ registries: platformRegistries, platformActivities: PLATFORM_ACTIVITIES });
for (const command of COMMANDS) platformRegistries.commands.register(command, 'core');
for (const module of BUILTIN_FEATURE_MODULES) featureModules.install(module);
export function resolveResourceView(resource) { return resolveView(platformRegistries, resource); }
export function listWorkspaceActivities() { return featureModules.activities(); }
export function resourcesForWorkspaceActivity(activityId) { const activity = featureModules.activities().find((candidate) => candidate.id === activityId); if (Array.isArray(activity?.resourceIds)) return activity.resourceIds.map((id) => getResource(id)).filter(Boolean); return resourcesForModule(activityId); }

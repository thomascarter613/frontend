const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

export function createRegistry(kind, initialEntries = []) {
  const entries = new Map();
  const sources = new Map();
  function register(entry, source = 'core') { if (!entry?.id || !ID_PATTERN.test(entry.id)) throw new TypeError(`${kind} contribution requires a stable id`); if (entries.has(entry.id)) throw new Error(`${kind} contribution already registered: ${entry.id}`); const value = Object.freeze({ ...entry }); entries.set(entry.id, value); sources.set(entry.id, source); return value; }
  function unregister(id, source = null) { if (source && sources.get(id) !== source) return false; sources.delete(id); return entries.delete(id); }
  initialEntries.forEach((entry) => register(entry));
  return Object.freeze({ kind, register, unregister, get: (id) => entries.get(id) ?? null, has: (id) => entries.has(id), list: () => [...entries.values()], sourceOf: (id) => sources.get(id) ?? null });
}
export const BUILTIN_VIEWS = Object.freeze([{ id: 'view.document', label: 'Document', resourceTypes: ['document'] }, { id: 'view.table', label: 'Table', resourceTypes: ['table'] }, { id: 'view.task', label: 'Task Detail', resourceTypes: ['task'] }, { id: 'view.workflow', label: 'Workflow', resourceTypes: ['workflow'] }, { id: 'view.project', label: 'Project', resourceTypes: ['project'] }]);
export const BUILTIN_EDITORS = Object.freeze([{ id: 'editor.document', label: 'Document Editor', resourceTypes: ['document'] }, { id: 'editor.resource', label: 'Resource Editor', resourceTypes: ['project', 'task'] }, { id: 'editor.data', label: 'Data Editor', resourceTypes: ['table'] }, { id: 'editor.workflow', label: 'Workflow Editor', resourceTypes: ['workflow'] }]);
export const BUILTIN_FIELDS = Object.freeze([
  { id: 'field.text', label: 'Text', valueType: 'string', control: 'text' }, { id: 'field.number', label: 'Number', valueType: 'number', control: 'number' }, { id: 'field.status', label: 'Status', valueType: 'string', control: 'select' }, { id: 'field.user', label: 'User', valueType: 'reference', control: 'text' }, { id: 'field.tags', label: 'Tags', valueType: 'array', control: 'tags' }, { id: 'field.date', label: 'Date', valueType: 'date', control: 'date' }, { id: 'field.relation', label: 'Relation', valueType: 'reference', control: 'text' }, { id: 'field.boolean', label: 'Boolean', valueType: 'boolean', control: 'checkbox' }, { id: 'field.richtext', label: 'Rich Text', valueType: 'string', control: 'textarea' },
]);
export const BUILTIN_ACTIONS = Object.freeze([{ id: 'action.resource.open', label: 'Open Resource', capability: 'resource.read' }, { id: 'action.resource.share', label: 'Share Resource', capability: 'resource.share' }, { id: 'action.editor.split', label: 'Split Editor', capability: 'editor.split' }, { id: 'action.job.start', label: 'Start Job', capability: 'job.start' }]);
export function createPlatformRegistries() { return { views: createRegistry('view', BUILTIN_VIEWS), editors: createRegistry('editor', BUILTIN_EDITORS), fields: createRegistry('field', BUILTIN_FIELDS), actions: createRegistry('action', BUILTIN_ACTIONS), commands: createRegistry('command'), inspectorSections: createRegistry('inspector section'), panels: createRegistry('panel') }; }
export function resolveView(registries, resource) { if (!resource) return null; return registries.views.list().find((view) => view.resourceTypes?.includes(resource.type)) ?? null; }

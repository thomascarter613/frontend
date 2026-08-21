const FILTER_OPERATORS = new Set(['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte', 'in', 'exists']);

export function createFilter({ field, operator = 'eq', value = null } = {}) {
  if (!field || !FILTER_OPERATORS.has(operator)) throw new TypeError('Filter requires field and supported operator');
  return Object.freeze({ type: 'condition', field, operator, value });
}

export function combineFilters(operator, ...children) {
  const normalized = operator.toUpperCase();
  if (!['AND', 'OR'].includes(normalized)) throw new TypeError('Filter group operator must be AND or OR');
  return Object.freeze({ type: 'group', operator: normalized, children: children.flat().filter(Boolean) });
}

export function createSavedView({ id, name, resourceType, viewType, filters = null, sort = [], group = null, fields = [], settings = {}, scope = 'personal' } = {}) {
  if (!id || !name || !resourceType || !viewType) throw new TypeError('Saved View requires id, name, resourceType, and viewType');
  if (!['personal', 'workspace'].includes(scope)) throw new TypeError('Saved View scope must be personal or workspace');
  return Object.freeze({ id, name, resourceType, viewType, filters, sort: [...sort], group, fields: [...fields], settings: { ...settings }, scope });
}

export function createTableViewState(savedView = null) {
  return { sort: [...(savedView?.sort ?? [])], filters: savedView?.filters ?? null, grouping: savedView?.group ?? null, columnVisibility: { ...(savedView?.settings?.columnVisibility ?? {}) }, columnWidths: { ...(savedView?.settings?.columnWidths ?? {}) }, pagination: { page: 1, pageSize: savedView?.settings?.pageSize ?? 50 }, density: savedView?.settings?.density ?? 'default' };
}

export function serializeTableViewState({ id, name, resourceType, state, fields = [], scope = 'personal' }) {
  return createSavedView({ id, name, resourceType, viewType: 'table', filters: state.filters, sort: state.sort, group: state.grouping, fields, scope, settings: { columnVisibility: state.columnVisibility, columnWidths: state.columnWidths, pageSize: state.pagination.pageSize, density: state.density } });
}

export const BUILTIN_SAVED_VIEWS = Object.freeze([
  createSavedView({ id: 'view.saved.recent', name: 'Recently updated', resourceType: 'document', viewType: 'list', sort: [{ field: 'updated', direction: 'desc' }], scope: 'personal' }),
  createSavedView({ id: 'view.saved.review', name: 'Needs review', resourceType: 'task', viewType: 'list', filters: createFilter({ field: 'status', operator: 'eq', value: 'Review' }), scope: 'workspace' }),
  createSavedView({ id: 'view.saved.metrics', name: 'Project Metrics', resourceType: 'table', viewType: 'table', fields: ['component', 'owner', 'status', 'updated', 'progress'], scope: 'workspace' }),
]);

const ROUTE_PREFIX = '/workspaces';

export function createRoute({ workspaceId = 'default', resourceId = null, viewId = null, filter = null, subview = null } = {}) {
  return Object.freeze({ workspaceId, resourceId, viewId, filter, subview });
}

export function serializeRoute(route) {
  const workspaceId = encodeURIComponent(route?.workspaceId ?? 'default');
  const resourceId = route?.resourceId ? `/resources/${encodeURIComponent(route.resourceId)}` : '';
  const params = new URLSearchParams();
  if (route?.viewId) params.set('view', route.viewId);
  if (route?.filter) params.set('filter', JSON.stringify(route.filter));
  if (route?.subview) params.set('subview', route.subview);
  const query = params.toString();
  return `${ROUTE_PREFIX}/${workspaceId}${resourceId}${query ? `?${query}` : ''}`;
}

export function parseRoute(input) {
  const url = input instanceof URL ? input : new URL(String(input), 'https://workspace.local');
  const match = url.pathname.match(/^\/workspaces\/([^/]+)(?:\/resources\/([^/]+))?\/?$/);
  if (!match) return null;
  let filter = null;
  const rawFilter = url.searchParams.get('filter');
  if (rawFilter) {
    try { filter = JSON.parse(rawFilter); } catch { filter = null; }
  }
  return createRoute({
    workspaceId: decodeURIComponent(match[1]),
    resourceId: match[2] ? decodeURIComponent(match[2]) : null,
    viewId: url.searchParams.get('view'),
    filter,
    subview: url.searchParams.get('subview'),
  });
}

export function shareableStateFromState(state) {
  return createRoute({
    workspaceId: state.navigation.workspaceId ?? 'default',
    resourceId: state.selectedResourceId,
    viewId: state.navigation.viewId ?? null,
    filter: state.navigation.filter ?? null,
    subview: state.navigation.subview ?? null,
  });
}

export function localWorkspaceStateFromState(state) {
  return Object.freeze({ workspace: { ...state.workspace }, editors: state.editors, appearance: { ...state.appearance } });
}

export function resolveRoute(route, { getResource, registries }) {
  if (!route?.resourceId) return { route, resource: null, view: null, fallback: false };
  const resource = getResource(route.resourceId);
  if (!resource) return { route, resource: null, view: null, fallback: false };
  const requested = route.viewId ? registries.views.get(route.viewId) : null;
  const compatible = requested?.resourceTypes?.includes(resource.type) ? requested : null;
  const fallbackView = registries.views.list().find((view) => view.resourceTypes?.includes(resource.type)) ?? null;
  return { route, resource, view: compatible ?? fallbackView, fallback: Boolean(route.viewId && !compatible) };
}

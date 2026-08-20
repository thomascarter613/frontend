import { getPreset } from '../workspace/presets.js';

const STORAGE_KEY = 'maximum-workspace:v1';

export function createInitialState(saved = null) {
  const preset = getPreset(saved?.workspace?.preset ?? 'maximum');
  return {
    workspace: {
      preset: preset.id,
      sidebar: saved?.workspace?.sidebar ?? preset.sidebar,
      inspector: saved?.workspace?.inspector ?? preset.inspector,
      bottomPanel: saved?.workspace?.bottomPanel ?? preset.bottomPanel,
      secondaryEditor: saved?.workspace?.secondaryEditor ?? preset.secondaryEditor,
      activityRail: saved?.workspace?.activityRail ?? preset.activityRail,
      sidebarWidth: saved?.workspace?.sidebarWidth ?? 270,
      inspectorWidth: saved?.workspace?.inspectorWidth ?? 310,
      bottomPanelHeight: saved?.workspace?.bottomPanelHeight ?? 210,
      editorSplit: saved?.workspace?.editorSplit ?? 64,
      bottomPanelTab: saved?.workspace?.bottomPanelTab ?? preset.bottomPanelTab ?? 'activity',
      inspectorTab: saved?.workspace?.inspectorTab ?? preset.inspectorTab ?? 'properties',
    },
    navigation: {
      module: saved?.navigation?.module ?? 'explorer',
      expanded: new Set(saved?.navigation?.expanded ?? ['projects', 'knowledge', 'data']),
    },
    editors: {
      groups: saved?.editors?.groups ?? [
        { id: 'group-a', tabs: ['document-architecture', 'task-shell-keyboard'], active: 'document-architecture' },
        { id: 'group-b', tabs: ['table-project-metrics', 'workflow-release'], active: 'table-project-metrics' },
      ],
      activeGroup: saved?.editors?.activeGroup ?? 'group-a',
    },
    drafts: { ...(saved?.drafts ?? {}) },
    appearance: {
      theme: saved?.appearance?.theme ?? 'dark',
      density: saved?.appearance?.density ?? 'default',
    },
    overlay: null,
    selectedResourceId: saved?.selectedResourceId ?? 'document-architecture',
    connection: {
      online: saved?.connection?.online ?? true,
      sync: saved?.connection?.sync ?? 'synced',
    },
    jobs: saved?.jobs ?? [],
    toasts: [],
  };
}

export function applyPreset(state, presetId) {
  const preset = getPreset(presetId);
  return {
    ...state,
    workspace: {
      ...state.workspace,
      preset: preset.id,
      sidebar: preset.sidebar,
      inspector: preset.inspector,
      bottomPanel: preset.bottomPanel,
      secondaryEditor: preset.secondaryEditor,
      activityRail: preset.activityRail,
      bottomPanelTab: preset.bottomPanelTab ?? state.workspace.bottomPanelTab,
      inspectorTab: preset.inspectorTab ?? state.workspace.inspectorTab,
    },
  };
}

function updateGroup(groups, groupId, updater) {
  return groups.map((group) => (group.id === groupId ? updater(group) : group));
}

export function reducer(state, action) {
  switch (action.type) {
    case 'workspace/applyPreset':
      return applyPreset(state, action.preset);
    case 'workspace/toggle': {
      const key = action.region;
      const current = state.workspace[key];
      const next = typeof current === 'boolean' ? !current : current === 'hidden' ? 'visible' : 'hidden';
      return { ...state, workspace: { ...state.workspace, [key]: next, preset: 'custom' } };
    }
    case 'workspace/setSize':
      return { ...state, workspace: { ...state.workspace, [action.key]: action.value, preset: 'custom' } };
    case 'workspace/setTab':
      return { ...state, workspace: { ...state.workspace, [action.region]: action.tab } };
    case 'navigation/setModule':
      return { ...state, navigation: { ...state.navigation, module: action.module } };
    case 'navigation/toggleExpanded': {
      const expanded = new Set(state.navigation.expanded);
      expanded.has(action.id) ? expanded.delete(action.id) : expanded.add(action.id);
      return { ...state, navigation: { ...state.navigation, expanded } };
    }
    case 'resource/select':
      return { ...state, selectedResourceId: action.id };
    case 'editor/activate':
      return {
        ...state,
        editors: {
          ...state.editors,
          activeGroup: action.groupId,
          groups: updateGroup(state.editors.groups, action.groupId, (group) => ({ ...group, active: action.resourceId })),
        },
        selectedResourceId: action.resourceId,
      };
    case 'editor/open': {
      const groupId = action.groupId ?? state.editors.activeGroup;
      return {
        ...state,
        editors: {
          ...state.editors,
          activeGroup: groupId,
          groups: updateGroup(state.editors.groups, groupId, (group) => ({
            ...group,
            tabs: group.tabs.includes(action.resourceId) ? group.tabs : [...group.tabs, action.resourceId],
            active: action.resourceId,
          })),
        },
        selectedResourceId: action.resourceId,
      };
    }
    case 'editor/close': {
      const groups = updateGroup(state.editors.groups, action.groupId, (group) => {
        const tabs = group.tabs.filter((id) => id !== action.resourceId);
        return { ...group, tabs, active: group.active === action.resourceId ? tabs.at(-1) ?? null : group.active };
      });
      return { ...state, editors: { ...state.editors, groups } };
    }
    case 'editor/move': {
      const from = action.fromGroupId;
      const to = action.toGroupId;
      if (from === to) return state;
      let groups = updateGroup(state.editors.groups, from, (group) => {
        const tabs = group.tabs.filter((id) => id !== action.resourceId);
        return { ...group, tabs, active: group.active === action.resourceId ? tabs.at(-1) ?? null : group.active };
      });
      groups = updateGroup(groups, to, (group) => ({
        ...group,
        tabs: group.tabs.includes(action.resourceId) ? group.tabs : [...group.tabs, action.resourceId],
        active: action.resourceId,
      }));
      return { ...state, editors: { ...state.editors, groups, activeGroup: to }, selectedResourceId: action.resourceId };
    }
    case 'draft/update':
      return { ...state, drafts: { ...state.drafts, [action.resourceId]: action.value }, connection: { ...state.connection, sync: state.connection.online ? 'saving' : 'offline changes' } };
    case 'draft/markSaved':
      return { ...state, connection: { ...state.connection, sync: state.connection.online ? 'synced' : 'offline changes' } };
    case 'appearance/theme':
      return { ...state, appearance: { ...state.appearance, theme: action.theme } };
    case 'appearance/density':
      return { ...state, appearance: { ...state.appearance, density: action.density } };
    case 'overlay/open':
      return { ...state, overlay: action.overlay };
    case 'overlay/close':
      return { ...state, overlay: null };
    case 'connection/set':
      return { ...state, connection: { online: action.online, sync: action.online ? 'synced' : 'offline' } };
    case 'job/add':
      return { ...state, jobs: [...state.jobs, action.job] };
    case 'job/update':
      return { ...state, jobs: state.jobs.map((job) => (job.id === action.id ? { ...job, ...action.patch } : job)) };
    case 'toast/add':
      return { ...state, toasts: [...state.toasts.slice(-3), action.toast] };
    case 'toast/remove':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    default:
      return state;
  }
}

function serializable(state) {
  return {
    ...state,
    navigation: { ...state.navigation, expanded: [...state.navigation.expanded] },
    overlay: null,
    toasts: [],
  };
}

export function loadPersistedState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(serializable(state)));
  } catch {
    // Persistence failure is intentionally non-fatal to the workspace.
  }
}

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach((listener) => listener(state, action));
      return action;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

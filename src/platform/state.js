import { getPreset } from '../workspace/presets.js';
import {
  collectGroupIds,
  createInitialEditorLayout,
  findSplit,
  removeGroup,
  setSplitRatio,
  splitGroup,
} from './editor-layout.js';
import { createCapabilityPolicy, DEFAULT_CAPABILITIES } from './permissions.js';

const STORAGE_KEY = 'maximum-workspace:v2';
const LEGACY_STORAGE_KEYS = Object.freeze(['maximum-workspace:v1']);

function normalizeSavedEditors(savedEditors) {
  const groups = savedEditors?.groups ?? [
    { id: 'group-a', tabs: ['document-architecture', 'task-shell-keyboard'], active: 'document-architecture' },
    { id: 'group-b', tabs: ['table-project-metrics', 'workflow-release'], active: 'table-project-metrics' },
  ];
  return {
    groups,
    activeGroup: savedEditors?.activeGroup ?? groups[0]?.id ?? 'group-a',
    layout: savedEditors?.layout ?? createInitialEditorLayout(),
    sequence: savedEditors?.sequence ?? groups.length,
  };
}

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
    editors: normalizeSavedEditors(saved?.editors),
    drafts: { ...(saved?.drafts ?? {}) },
    appearance: {
      theme: saved?.appearance?.theme ?? 'dark',
      density: saved?.appearance?.density ?? 'default',
    },
    permissions: createCapabilityPolicy(saved?.permissions ?? { allow: DEFAULT_CAPABILITIES }),
    overlay: null,
    selectedResourceId: saved?.selectedResourceId ?? 'document-architecture',
    connection: {
      online: saved?.connection?.online ?? true,
      sync: saved?.connection?.sync ?? 'synced',
    },
    jobs: saved?.jobs ?? [],
    errors: [],
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

function removeGroupEntity(groups, groupId) {
  return groups.filter((group) => group.id !== groupId);
}

function nextGroupId(editors, requestedId = null) {
  if (requestedId && !editors.groups.some((group) => group.id === requestedId)) return requestedId;
  let sequence = editors.sequence + 1;
  let id = `group-${sequence}`;
  while (editors.groups.some((group) => group.id === id)) {
    sequence += 1;
    id = `group-${sequence}`;
  }
  return id;
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
    case 'editor/split': {
      const sourceGroupId = action.groupId ?? state.editors.activeGroup;
      const sourceGroup = state.editors.groups.find((group) => group.id === sourceGroupId);
      if (!sourceGroup) return state;
      const newGroupId = nextGroupId(state.editors, action.newGroupId);
      const resourceId = action.resourceId ?? sourceGroup.active;
      const newGroup = { id: newGroupId, tabs: resourceId ? [resourceId] : [], active: resourceId ?? null };
      return {
        ...state,
        workspace: { ...state.workspace, secondaryEditor: true, preset: 'custom' },
        editors: {
          ...state.editors,
          groups: [...state.editors.groups, newGroup],
          activeGroup: newGroupId,
          sequence: Math.max(state.editors.sequence + 1, Number(newGroupId.split('-').at(-1)) || state.editors.sequence + 1),
          layout: splitGroup(state.editors.layout, sourceGroupId, newGroupId, {
            orientation: action.orientation ?? 'vertical',
            placement: action.placement ?? 'after',
            ratio: action.ratio ?? 0.5,
          }),
        },
        selectedResourceId: resourceId ?? state.selectedResourceId,
      };
    }
    case 'editor/closeGroup': {
      if (state.editors.groups.length <= 1) return state;
      const groups = removeGroupEntity(state.editors.groups, action.groupId);
      const layout = removeGroup(state.editors.layout, action.groupId);
      const remainingIds = collectGroupIds(layout);
      const activeGroup = state.editors.activeGroup === action.groupId ? remainingIds.at(-1) : state.editors.activeGroup;
      const activeResource = groups.find((group) => group.id === activeGroup)?.active ?? state.selectedResourceId;
      return {
        ...state,
        editors: { ...state.editors, groups, layout, activeGroup },
        selectedResourceId: activeResource,
      };
    }
    case 'editor/setSplitRatio':
      return {
        ...state,
        workspace: { ...state.workspace, preset: 'custom' },
        editors: { ...state.editors, layout: setSplitRatio(state.editors.layout, action.splitId, action.ratio) },
      };
    case 'draft/update':
      return { ...state, drafts: { ...state.drafts, [action.resourceId]: action.value }, connection: { ...state.connection, sync: state.connection.online ? 'saving' : 'offline changes' } };
    case 'draft/markSaved':
      return { ...state, connection: { ...state.connection, sync: state.connection.online ? 'synced' : 'offline changes' } };
    case 'appearance/theme':
      return { ...state, appearance: { ...state.appearance, theme: action.theme } };
    case 'appearance/density':
      return { ...state, appearance: { ...state.appearance, density: action.density } };
    case 'permissions/set':
      return { ...state, permissions: createCapabilityPolicy(action.policy) };
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
    case 'error/add':
      return { ...state, errors: [...state.errors.slice(-19), action.error] };
    case 'error/dismiss':
      return { ...state, errors: state.errors.filter((error) => error.code !== action.code) };
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
    errors: [],
    toasts: [],
  };
}

export function loadPersistedState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = storage?.getItem(key);
      if (legacy) return JSON.parse(legacy);
    }
    return null;
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

export { STORAGE_KEY, LEGACY_STORAGE_KEYS, findSplit };

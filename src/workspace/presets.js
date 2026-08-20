export const WORKSPACE_PRESETS = Object.freeze({
  maximum: {
    id: 'maximum',
    label: 'Maximum',
    sidebar: 'visible',
    inspector: 'visible',
    bottomPanel: 'visible',
    secondaryEditor: true,
    activityRail: true,
  },
  focus: {
    id: 'focus',
    label: 'Focus',
    sidebar: 'hidden',
    inspector: 'hidden',
    bottomPanel: 'hidden',
    secondaryEditor: false,
    activityRail: true,
  },
  research: {
    id: 'research',
    label: 'Research',
    sidebar: 'visible',
    inspector: 'visible',
    bottomPanel: 'hidden',
    secondaryEditor: true,
    activityRail: true,
  },
  development: {
    id: 'development',
    label: 'Development',
    sidebar: 'visible',
    inspector: 'hidden',
    bottomPanel: 'visible',
    secondaryEditor: true,
    activityRail: true,
    bottomPanelTab: 'terminal',
  },
  review: {
    id: 'review',
    label: 'Review',
    sidebar: 'hidden',
    inspector: 'visible',
    bottomPanel: 'hidden',
    secondaryEditor: false,
    activityRail: true,
    inspectorTab: 'activity',
  },
  zen: {
    id: 'zen',
    label: 'Zen',
    sidebar: 'hidden',
    inspector: 'hidden',
    bottomPanel: 'hidden',
    secondaryEditor: false,
    activityRail: false,
  },
});

export function getPreset(id) {
  return WORKSPACE_PRESETS[id] ?? WORKSPACE_PRESETS.maximum;
}

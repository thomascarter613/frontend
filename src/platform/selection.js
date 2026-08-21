export function createSelection({ scope = null, mode = 'none', ids = [], anchorId = null, query = null, excludedIds = [] } = {}) {
  return Object.freeze({
    scope,
    mode,
    ids: [...new Set(ids)],
    anchorId,
    query,
    excludedIds: [...new Set(excludedIds)],
  });
}

export function clearSelection(scope = null) {
  return createSelection({ scope });
}

export function selectSingle(scope, id) {
  return createSelection({ scope, mode: 'single', ids: [id], anchorId: id });
}

export function toggleSelection(selection, id) {
  const ids = new Set(selection?.ids ?? []);
  ids.has(id) ? ids.delete(id) : ids.add(id);
  const nextIds = [...ids];
  return createSelection({
    scope: selection?.scope ?? null,
    mode: nextIds.length === 0 ? 'none' : nextIds.length === 1 ? 'single' : 'multiple',
    ids: nextIds,
    anchorId: selection?.anchorId ?? id,
  });
}

export function selectRange(selection, orderedIds, toId) {
  const anchorId = selection?.anchorId ?? toId;
  const start = orderedIds.indexOf(anchorId);
  const end = orderedIds.indexOf(toId);
  if (start < 0 || end < 0) return selectSingle(selection?.scope ?? null, toId);
  const [low, high] = start <= end ? [start, end] : [end, start];
  return createSelection({ scope: selection?.scope ?? null, mode: 'range', ids: orderedIds.slice(low, high + 1), anchorId });
}

export function selectAllMatching(scope, query, excludedIds = []) {
  return createSelection({ scope, mode: 'all-matching', query, excludedIds });
}

export function isSelected(selection, id) {
  if (!selection) return false;
  if (selection.mode === 'all-matching') return !selection.excludedIds.includes(id);
  return selection.ids.includes(id);
}

export function selectionCount(selection, matchingCount = null) {
  if (!selection) return 0;
  if (selection.mode === 'all-matching') return matchingCount == null ? null : Math.max(0, matchingCount - selection.excludedIds.length);
  return selection.ids.length;
}

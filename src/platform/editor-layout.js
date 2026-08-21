export function groupNode(groupId) {
  return { type: 'group', id: `group-node:${groupId}`, groupId };
}

export function splitNode(first, second, { id, orientation = 'vertical', ratio = 0.5 } = {}) {
  return {
    type: 'split',
    id: id ?? `split:${first.id}:${second.id}`,
    orientation,
    ratio: clampRatio(ratio),
    first,
    second,
  };
}

export function createInitialEditorLayout() {
  return splitNode(groupNode('group-a'), groupNode('group-b'), {
    id: 'split-root',
    orientation: 'vertical',
    ratio: 0.64,
  });
}

export function clampRatio(value) {
  return Math.max(0.2, Math.min(0.8, Number(value) || 0.5));
}

export function collectGroupIds(node, output = []) {
  if (!node) return output;
  if (node.type === 'group') {
    output.push(node.groupId);
    return output;
  }
  collectGroupIds(node.first, output);
  collectGroupIds(node.second, output);
  return output;
}

export function findSplit(node, splitId) {
  if (!node) return null;
  if (node.type === 'split' && node.id === splitId) return node;
  if (node.type !== 'split') return null;
  return findSplit(node.first, splitId) ?? findSplit(node.second, splitId);
}

export function replaceGroup(node, groupId, replacement) {
  if (!node) return node;
  if (node.type === 'group') return node.groupId === groupId ? replacement : node;
  return {
    ...node,
    first: replaceGroup(node.first, groupId, replacement),
    second: replaceGroup(node.second, groupId, replacement),
  };
}

export function splitGroup(node, groupId, newGroupId, { orientation = 'vertical', placement = 'after', ratio = 0.5 } = {}) {
  const current = groupNode(groupId);
  const added = groupNode(newGroupId);
  const replacement = placement === 'before'
    ? splitNode(added, current, { id: `split:${groupId}:${newGroupId}`, orientation, ratio: 1 - ratio })
    : splitNode(current, added, { id: `split:${groupId}:${newGroupId}`, orientation, ratio });
  return replaceGroup(node, groupId, replacement);
}

export function removeGroup(node, groupId) {
  if (!node) return null;
  if (node.type === 'group') return node.groupId === groupId ? null : node;
  const first = removeGroup(node.first, groupId);
  const second = removeGroup(node.second, groupId);
  if (!first) return second;
  if (!second) return first;
  return { ...node, first, second };
}

export function setSplitRatio(node, splitId, ratio) {
  if (!node) return node;
  if (node.type === 'split' && node.id === splitId) return { ...node, ratio: clampRatio(ratio) };
  if (node.type !== 'split') return node;
  return {
    ...node,
    first: setSplitRatio(node.first, splitId, ratio),
    second: setSplitRatio(node.second, splitId, ratio),
  };
}

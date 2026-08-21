export function createUndoService({ limit = 100 } = {}) {
  const past = [];
  const future = [];

  function record({ id, label, undoAction, redoAction, mergeKey = null } = {}) {
    if (!label || !undoAction || !redoAction) throw new TypeError('Undo entries require label, undoAction, and redoAction');
    const entry = Object.freeze({ id: id ?? `undo-${Date.now()}`, label, undoAction, redoAction, mergeKey });
    const previous = past.at(-1);
    if (mergeKey && previous?.mergeKey === mergeKey) past[past.length - 1] = entry;
    else past.push(entry);
    if (past.length > limit) past.shift();
    future.length = 0;
    return entry;
  }

  function undo(dispatch) {
    const entry = past.pop();
    if (!entry) return null;
    dispatch(entry.undoAction);
    future.push(entry);
    return entry;
  }

  function redo(dispatch) {
    const entry = future.pop();
    if (!entry) return null;
    dispatch(entry.redoAction);
    past.push(entry);
    return entry;
  }

  return Object.freeze({
    record,
    undo,
    redo,
    clear() { past.length = 0; future.length = 0; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    peekUndo: () => past.at(-1) ?? null,
    peekRedo: () => future.at(-1) ?? null,
    snapshot: () => ({ past: past.map(({ id, label }) => ({ id, label })), future: future.map(({ id, label }) => ({ id, label })) }),
  });
}

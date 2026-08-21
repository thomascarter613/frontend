function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number`);
  return value;
}

export function createVirtualWindow({ totalCount, rowHeight, viewportHeight, scrollTop = 0, overscan = 4 } = {}) {
  finiteNonNegative(totalCount, 'totalCount');
  finiteNonNegative(viewportHeight, 'viewportHeight');
  finiteNonNegative(scrollTop, 'scrollTop');
  if (!Number.isFinite(rowHeight) || rowHeight <= 0) throw new TypeError('rowHeight must be greater than zero');
  finiteNonNegative(overscan, 'overscan');

  const visibleStart = Math.min(totalCount, Math.floor(scrollTop / rowHeight));
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const start = Math.max(0, visibleStart - Math.floor(overscan));
  const end = Math.min(totalCount, visibleStart + visibleCount + Math.floor(overscan));
  return Object.freeze({
    start,
    end,
    count: Math.max(0, end - start),
    offsetTop: start * rowHeight,
    totalSize: totalCount * rowHeight,
    paddingBottom: Math.max(0, (totalCount - end) * rowHeight),
  });
}

export function createLatestRequestGuard() {
  let epoch = 0;
  return Object.freeze({
    begin() { epoch += 1; return epoch; },
    isCurrent(token) { return token === epoch; },
    invalidate() { epoch += 1; return epoch; },
    current() { return epoch; },
  });
}

export function createLatestOnlyExecutor(loader) {
  if (typeof loader !== 'function') throw new TypeError('loader must be a function');
  const guard = createLatestRequestGuard();
  return Object.freeze({
    async run(input) {
      const token = guard.begin();
      const value = await loader(input, token);
      return guard.isCurrent(token)
        ? Object.freeze({ stale: false, token, value })
        : Object.freeze({ stale: true, token, value: null });
    },
    invalidate: guard.invalidate,
  });
}

export function createProgressivePage({ items = [], total = items.length, cursor = null, hasMore = false } = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  finiteNonNegative(total, 'total');
  return Object.freeze({ items: [...items], total, cursor, hasMore: Boolean(hasMore) });
}

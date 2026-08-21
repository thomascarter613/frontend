import test from 'node:test';
import assert from 'node:assert/strict';
import { createVirtualWindow, createLatestRequestGuard, createLatestOnlyExecutor, createProgressivePage } from '../src/platform/performance.js';

test('virtual window renders a bounded slice with overscan', () => {
  const window = createVirtualWindow({ totalCount: 10000, rowHeight: 32, viewportHeight: 320, scrollTop: 3200, overscan: 3 });
  assert.deepEqual({ start: window.start, end: window.end, count: window.count }, { start: 97, end: 113, count: 16 });
  assert.equal(window.totalSize, 320000);
});

test('latest request guard marks earlier search work stale', () => {
  const guard = createLatestRequestGuard();
  const first = guard.begin();
  const second = guard.begin();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
});

test('latest-only executor ignores stale async results', async () => {
  const resolvers = [];
  const executor = createLatestOnlyExecutor((input) => new Promise((resolve) => resolvers.push(() => resolve(input))));
  const first = executor.run('first');
  const second = executor.run('second');
  resolvers[0]();
  resolvers[1]();
  assert.equal((await first).stale, true);
  assert.deepEqual(await second, { stale: false, token: 2, value: 'second' });
});

test('progressive page keeps pagination metadata separate from items', () => {
  const page = createProgressivePage({ items: [1, 2], total: 10, cursor: 'next', hasMore: true });
  assert.equal(page.total, 10);
  assert.equal(page.hasMore, true);
});

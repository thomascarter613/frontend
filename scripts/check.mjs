import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const tests = (await readdir(new URL('../tests/', import.meta.url)))
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => `tests/${name}`);

for (const [label, command, args] of [
  ['tests', process.execPath, ['--test', ...tests]],
  ['build', process.execPath, ['scripts/build.mjs']],
]) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nAll checks passed.');

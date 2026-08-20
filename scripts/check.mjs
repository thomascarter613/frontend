import { spawnSync } from 'node:child_process';

for (const [label, command, args] of [
  ['tests', process.execPath, ['--test', 'tests/state.test.mjs', 'tests/commands.test.mjs', 'tests/render.test.mjs']],
  ['build', process.execPath, ['scripts/build.mjs']],
]) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nAll checks passed.');

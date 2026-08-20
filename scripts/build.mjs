import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const entry of ['index.html', 'src']) {
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}
console.log('Built static application to dist/.');

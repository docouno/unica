import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const app = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const result = spawnSync(
  'npm',
  ['ls', '--all', '--offline', '--json', '--workspaces', '--include-workspace-root'],
  { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);

if (result.status !== 0) {
  process.exit(1);
}

// npm can report success for an empty tree when workspace links are missing.
const tree = JSON.parse(result.stdout);
process.exit(Object.hasOwn(tree.dependencies ?? {}, app.name) ? 0 : 1);

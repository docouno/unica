import { accessSync, constants, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(import.meta.dirname, '..');
const requiredSpecifiers = ['playwright-core', 'vite', '@vitejs/plugin-react', '@docouno/env/vite'];

try {
  for (const specifier of requiredSpecifiers) {
    const resolvedPath = realpathSync(fileURLToPath(import.meta.resolve(specifier)));
    accessSync(resolvedPath, constants.R_OK);
  }

  const playwrightCliPath = realpathSync(resolve(appRoot, 'node_modules/playwright-core/cli.js'));
  accessSync(playwrightCliPath, constants.R_OK);

  const unicaPkgPath = realpathSync(
    fileURLToPath(import.meta.resolve('@docouno/unica/package.json')),
  );
  const expectedUnicaPkgPath = realpathSync(resolve(appRoot, '../../packages/ui/package.json'));
  if (unicaPkgPath !== expectedUnicaPkgPath) {
    throw new Error(
      `@docouno/unica/package.json resolved to ${unicaPkgPath}, expected ${expectedUnicaPkgPath}`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`visual-ready: ${message}\n`);
  process.exit(1);
}

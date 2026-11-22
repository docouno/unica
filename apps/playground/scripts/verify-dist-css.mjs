import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';
import { verifyHoverPreviewCss } from '../../../scripts/verify-hover-preview-css.mjs';

const assetsDir = resolve(import.meta.dirname, '../dist/assets');
const cssFiles = (await readdir(assetsDir)).filter((name) => name.endsWith('.css')).sort();
assert.ok(cssFiles.length > 0, 'apps/playground/dist/assets must contain emitted CSS assets');

const sources = await Promise.all(
  cssFiles.map(async (file) => {
    const filename = resolve(assetsDir, file);
    const code = await readFile(filename);
    assert.equal(
      code.includes(':lang('),
      false,
      `${file} must not contain :lang( rewritten from :dir()`,
    );
    return { filename, code };
  }),
);

verifyHoverPreviewCss(transform, sources, 'playground dist CSS');

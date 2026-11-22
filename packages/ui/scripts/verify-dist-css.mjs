import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postcss from 'postcss';

const distCssPath = resolve(import.meta.dirname, '../dist/style.css');
const css = await readFile(distCssPath, 'utf8');
assert.ok(css.length > 0, 'dist/style.css must not be empty');

const root = postcss.parse(css, { from: distCssPath });

let hasWebkitUserSelect = false;
let hasFlattenedDividerLine = false;
let hasDirSupportsLtr = false;
let hasDirSupportsRtl = false;

root.walkDecls((decl) => {
  if (decl.prop === '-webkit-user-select') {
    hasWebkitUserSelect = true;
  }
});

root.walkAtRules((atRule) => {
  assert.equal(
    atRule.params.includes(':lang('),
    false,
    `dist/style.css must not rewrite :dir() into :lang() in @${atRule.name} ${atRule.params}`,
  );
});

root.walkRules((rule) => {
  assert.equal(
    rule.selector.includes(':lang('),
    false,
    `dist/style.css must not rewrite :dir() into :lang() in selector: ${rule.selector}`,
  );

  if (rule.selector.includes('.unica-divider')) {
    assert.equal(
      rule.selector.includes('&'),
      false,
      `Divider selector must be flattened: ${rule.selector}`,
    );
    assert.notEqual(
      rule.parent?.type,
      'rule',
      `Divider rule must not stay nested inside another rule: ${rule.selector}`,
    );
    if (
      rule.selector.includes('[data-unica-divider-orientation') &&
      rule.selector.includes('.unica-divider-line')
    ) {
      hasFlattenedDividerLine = true;
    }
  }

  if (
    rule.parent?.type === 'atrule' &&
    rule.parent.name === 'supports' &&
    rule.parent.params.includes('selector(:dir(rtl))')
  ) {
    if (rule.selector.includes(':dir(ltr)')) {
      hasDirSupportsLtr = true;
    }
    if (rule.selector.includes(':dir(rtl)')) {
      hasDirSupportsRtl = true;
    }
  }
});

assert.equal(
  hasWebkitUserSelect,
  true,
  'dist/style.css must emit -webkit-user-select for Baseline',
);
assert.equal(
  hasFlattenedDividerLine,
  true,
  'dist/style.css must contain flattened Divider child selectors',
);
assert.equal(hasDirSupportsLtr, true, 'dist/style.css must preserve :dir(ltr) under @supports');
assert.equal(hasDirSupportsRtl, true, 'dist/style.css must preserve :dir(rtl) under @supports');

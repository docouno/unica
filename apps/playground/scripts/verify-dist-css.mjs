import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';

const assetsDir = resolve(import.meta.dirname, '../dist/assets');
const cssFiles = (await readdir(assetsDir)).filter((name) => name.endsWith('.css')).sort();
assert.ok(cssFiles.length > 0, 'apps/playground/dist/assets must contain emitted CSS assets');

let hasWebkitBackdropFilter = false;
let hasWebkitMaskImage = false;
let hasTooltipFallback = false;

function hasBackdropFallbackCondition(condition) {
  if (!condition || condition.type !== 'not') {
    return false;
  }
  const inner = condition.value;
  if (inner.type === 'declaration') {
    const prefixes = new Set(inner.propertyId?.vendor_prefix ?? []);
    return (
      inner.propertyId?.property === 'backdrop-filter' &&
      prefixes.has('none') &&
      prefixes.has('webkit')
    );
  }
  if (inner.type === 'or') {
    let hasStandard = false;
    let hasWebkit = false;
    for (const branch of inner.value) {
      if (branch.type === 'declaration' && branch.propertyId?.property === 'backdrop-filter') {
        const prefixes = new Set(branch.propertyId.vendor_prefix ?? []);
        if (prefixes.has('none')) {
          hasStandard = true;
        }
        if (prefixes.has('webkit')) {
          hasWebkit = true;
        }
      }
    }
    return hasStandard && hasWebkit;
  }
  return false;
}

function selectorHasClass(selector, className) {
  return selector.some((part) => part.type === 'class' && part.name === className);
}

function setsBackgroundSurface(declarations) {
  const all = [
    ...(declarations?.declarations ?? []),
    ...(declarations?.importantDeclarations ?? []),
  ];
  return all.some(
    (decl) =>
      decl.property === 'unparsed' &&
      (decl.value?.propertyId?.property === 'background' ||
        decl.value?.propertyId?.property === 'background-color') &&
      Array.isArray(decl.value.value) &&
      decl.value.value.some(
        (token) => token.type === 'var' && token.value?.name?.ident === '--bg-surface',
      ),
  );
}

for (const file of cssFiles) {
  const fullPath = resolve(assetsDir, file);
  const css = await readFile(fullPath, 'utf8');
  assert.equal(
    css.includes(':lang('),
    false,
    `${file} must not contain :lang( rewritten from :dir()`,
  );
  if (css.includes('-webkit-backdrop-filter')) {
    hasWebkitBackdropFilter = true;
  }
  if (css.includes('-webkit-mask-image')) {
    hasWebkitMaskImage = true;
  }

  transform({
    filename: fullPath,
    code: Buffer.from(css),
    visitor: {
      Rule: {
        supports(rule) {
          if (!hasBackdropFallbackCondition(rule.value.condition)) {
            return;
          }
          let tooltipCovered = false;
          let hoverCardCovered = false;
          for (const child of rule.value.rules) {
            if (child.type !== 'style' || !setsBackgroundSurface(child.value.declarations)) {
              continue;
            }
            for (const selector of child.value.selectors) {
              if (selectorHasClass(selector, 'tooltip-proto')) {
                tooltipCovered = true;
              }
              if (selectorHasClass(selector, 'hover-card-proto')) {
                hoverCardCovered = true;
              }
            }
          }
          if (tooltipCovered && hoverCardCovered) {
            hasTooltipFallback = true;
          }
        },
      },
    },
  });
}

assert.equal(
  hasWebkitBackdropFilter,
  true,
  'playground dist CSS must emit -webkit-backdrop-filter for Baseline Safari 17',
);
assert.equal(
  hasWebkitMaskImage,
  true,
  'playground dist CSS must emit -webkit-mask-image for Baseline Safari 17',
);
assert.equal(
  hasTooltipFallback,
  true,
  'playground dist CSS must preserve the @supports not backdrop-filter fallback for .tooltip-proto and .hover-card-proto',
);

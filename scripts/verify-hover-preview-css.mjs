import assert from 'node:assert/strict';

const families = ['unica-tooltip', 'unica-hover-card'];
const fallback = 'opaque fill under the standard and WebKit backdrop fallback';

function lacksBackdropFilter(condition) {
  if (condition.type !== 'not') {
    return false;
  }
  const support = condition.value;
  const alternatives = support.type === 'or' ? support.value : [support];
  const prefixes = new Set();
  for (const alternative of alternatives) {
    if (
      alternative.type !== 'declaration' ||
      alternative.propertyId?.property !== 'backdrop-filter' ||
      alternative.value !== 'blur(1px)'
    ) {
      return false;
    }
    for (const prefix of alternative.propertyId.vendor_prefix ?? []) {
      prefixes.add(prefix);
    }
  }
  return prefixes.has('none') && prefixes.has('webkit');
}

function selectorTargets(selector, family) {
  return selector.some(
    (part) =>
      (part.type === 'class' && part.name === family) ||
      (part.type === 'pseudo-class' &&
        (part.kind === 'is' || part.kind === 'where') &&
        part.selectors.some((entry) => selectorTargets(entry, family))),
  );
}

function emittedMaterial({ declarations, importantDeclarations }, underFallback) {
  const material = new Set();
  for (const declaration of [...declarations, ...importantDeclarations]) {
    if (declaration.property !== 'unparsed') {
      continue;
    }
    const { propertyId, value } = declaration.value;
    const { property, vendor_prefix: prefixes = [] } = propertyId;
    const uses = (name) =>
      value.some((token) => token.type === 'var' && token.value.name.ident === name);
    if (property === 'background' || property === 'background-color') {
      if (underFallback && uses('--bg-surface')) {
        material.add(fallback);
      } else if (!underFallback && uses('--bg-overlay')) {
        material.add('overlay fill');
      }
    }
    if (
      (property === 'backdrop-filter' && uses('--_overlay-backdrop')) ||
      (property === 'mask-image' && uses('--_overlay-rim-mask'))
    ) {
      if (prefixes.length === 0 || prefixes.includes('none')) {
        material.add(property);
      }
      if (prefixes.includes('webkit')) {
        material.add(`-webkit-${property}`);
      }
    }
  }
  return material;
}

/** Verify each family's emitted material across layers and chunks. */
export function verifyHoverPreviewCss(transform, sources, output) {
  const coverage = new Map(families.map((family) => [family, new Set()]));

  for (const { filename, code } of sources) {
    let fallbackDepth = 0;
    transform({
      filename,
      code,
      visitor: {
        Rule: {
          supports(rule) {
            if (lacksBackdropFilter(rule.value.condition)) {
              fallbackDepth++;
            }
          },
          style(rule) {
            const material = emittedMaterial(rule.value.declarations, fallbackDepth > 0);
            if (material.size === 0) {
              return;
            }
            for (const [family, matches] of coverage) {
              if (rule.value.selectors.some((selector) => selectorTargets(selector, family))) {
                for (const match of material) {
                  matches.add(match);
                }
              }
            }
          },
        },
        RuleExit: {
          supports(rule) {
            if (lacksBackdropFilter(rule.value.condition)) {
              fallbackDepth--;
            }
          },
        },
      },
    });
  }

  for (const [family, matches] of coverage) {
    for (const expected of [
      'overlay fill',
      'backdrop-filter',
      '-webkit-backdrop-filter',
      'mask-image',
      '-webkit-mask-image',
      fallback,
    ]) {
      assert.ok(matches.has(expected), `${output} must emit ${expected} for .${family}`);
    }
  }
}

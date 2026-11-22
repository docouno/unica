import { Buffer } from 'node:buffer';
import { Features, transform } from 'lightningcss';
import postcss from 'postcss';
import { expect, it } from 'vitest';
import { BASELINE_TARGETS, createLightningCssOptions } from '../../../css.config.mjs';

it('lowers Baseline CSS prefixes and nesting while preserving :dir() selectors', () => {
  const options = createLightningCssOptions(Features);
  expect(options.targets).toEqual(BASELINE_TARGETS);
  expect(options.include & Features.Nesting).toBe(Features.Nesting);
  expect(options.exclude & Features.DirSelector).toBe(Features.DirSelector);

  const fixture = `
@layer unica.components {
  .fixture-surface {
    user-select: none;
    backdrop-filter: blur(12px);
    mask-image: linear-gradient(to bottom, black, transparent);

    > .fixture-child {
      color: var(--fg-primary);
    }
  }

  @supports selector(:dir(rtl)) {
    .fixture-surface:dir(ltr) {
      scale: none;
    }

    .fixture-surface:dir(rtl) {
      scale: -1 1;
    }
  }
}
`;

  const result = transform({
    filename: 'fixture.css',
    code: Buffer.from(fixture),
    minify: false,
    ...options,
  });

  const output = Buffer.from(result.code).toString('utf8');
  expect(output).not.toContain(':lang(');

  const root = postcss.parse(output);
  const props = new Set<string>();
  const selectors: string[] = [];
  let hasDirSupports = false;

  root.walkDecls((decl) => {
    props.add(decl.prop);
  });
  root.walkAtRules('supports', (atRule) => {
    if (atRule.params.includes('selector(:dir(rtl))')) {
      hasDirSupports = true;
    }
  });
  root.walkRules((rule) => {
    selectors.push(rule.selector);
    expect(rule.selector).not.toContain('&');
    expect(rule.parent?.type).not.toBe('rule');
  });

  expect(props.has('-webkit-user-select')).toBe(true);
  expect(props.has('-webkit-backdrop-filter')).toBe(true);
  expect(props.has('-webkit-mask-image')).toBe(true);
  expect(hasDirSupports).toBe(true);
  expect(selectors.some((selector) => selector.includes('.fixture-surface > .fixture-child'))).toBe(
    true,
  );
  expect(selectors.some((selector) => selector.includes(':dir(ltr)'))).toBe(true);
  expect(selectors.some((selector) => selector.includes(':dir(rtl)'))).toBe(true);
});

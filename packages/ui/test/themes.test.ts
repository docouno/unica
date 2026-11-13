import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { THEME_PRESETS } from '../src/index.js';

function parsePresetBlock(css: string, presetId: string): Map<string, string> {
  const escaped = presetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(?:^|\\n)(?::root,\\s*)?\\[data-theme='${escaped}'\\]\\s*\\{([^}]*)\\}`,
    'm',
  );
  const match = re.exec(css);
  const body = match?.[1];
  if (body === undefined) {
    throw new Error(`Missing [data-theme='${presetId}'] block`);
  }
  const props = new Map<string, string>();
  for (const line of body.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const val = line
      .slice(idx + 1)
      .replace(/;\s*$/, '')
      .trim();
    if (key) {
      props.set(key, val);
    }
  }
  return props;
}

it('exports all 6 canonical theme presets with symmetric, self-contained CSS token cascades', async () => {
  expect(THEME_PRESETS.map((preset) => preset.id)).toEqual([
    'soft-dark',
    'soft-light',
    'frost-dark',
    'frost-light',
    'pixel-dark',
    'pixel-light',
  ]);

  const css = await readFile(resolve(import.meta.dirname, '../src/styles.css'), 'utf8');

  const declaredVars = new Set<string>();
  for (const m of css.matchAll(/^\s*(--[a-zA-Z0-9_-]+)\s*:/gm)) {
    const name = m[1];
    if (name !== undefined) {
      declaredVars.add(name);
    }
  }

  for (const m of css.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)) {
    const refName = m[1];
    if (refName !== undefined) {
      expect(declaredVars.has(refName), `Unresolved CSS variable reference ${refName}`).toBe(true);
    }
  }

  for (const requiredToken of [
    '--fg-on-accent',
    '--fg-on-neutral',
    '--fg-on-info',
    '--fg-on-success',
    '--fg-on-warning',
    '--fg-on-danger',
    '--neutral-solid',
    '--neutral-solid-hover',
    '--neutral-solid-active',
    '--neutral-soft-bg',
    '--neutral-soft-fg',
    '--neutral-border',
    '--neutral-signal',
    '--radius-circular',
    '--radius-full',
    '--z-content',
    '--z-sticky',
    '--space-0',
    '--space-64',
    '--space-xs',
    '--space-s',
    '--space-m',
    '--space-l',
    '--space-xl',
  ]) {
    expect(declaredVars.has(requiredToken), `Missing ${requiredToken} in styles.css`).toBe(true);
  }

  let baselineKeys: string[] | null = null;
  for (const preset of THEME_PRESETS) {
    const props = parsePresetBlock(css, preset.id);
    expect(props.get('color-scheme')).toBe(preset.colorScheme);
    expect(props.get('--radius-factor')).toBe(String(preset.radiusFactor));

    const customKeys = [...props.keys()].filter((k) => k.startsWith('--')).sort();
    expect(customKeys.length).toBeGreaterThanOrEqual(115);
    if (baselineKeys === null) {
      baselineKeys = customKeys;
    } else {
      expect(customKeys, `Preset ${preset.id} custom property set drifted`).toEqual(baselineKeys);
    }
  }

  expect(css).toContain(":root,\n[data-theme],\n[data-surface='base'] {");
  expect(css).toContain("[data-surface='overlay'] {");
  expect(css).toContain(':root,\n[data-theme] {\n  --radius-xs: calc(4px * var(--radius-factor));');
  expect(css).toContain(':root,\n[data-theme],\n[data-text-scale] {');
});

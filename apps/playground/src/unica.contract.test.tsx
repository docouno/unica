import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import { format } from 'prettier/standalone';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import * as UnicaPackage from '@docouno/unica';
import { unicaWorkbench } from './unica.workbench.js';
import { UsageView } from './workbench/UsageView.js';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';
import { macroBoundsForTheme } from './workbench/themeEditorState.js';
import {
  buildPairwise,
  componentCode,
  defaultValues,
  evaluate,
  finiteDomain,
  validateCatalog,
} from './workbench/schema.js';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

async function collectFiles(dirPath: string, exts: readonly string[]): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(full, exts)));
    } else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

it('discovers shipped actions and scene entries and renders six themed Subjects', () => {
  expect(() => validateCatalog(unicaWorkbench)).not.toThrow();
  expect(unicaWorkbench.themes).toHaveLength(6);
  expect(unicaWorkbench.components.find(({ id }) => id === 'button')?.status).toBe('UI');
  expect(unicaWorkbench.scenes.find(({ id }) => id === '01-sign-in')?.uses).toContain('button');

  window.history.replaceState(null, '', '/?item=button');
  const { container } = render(<WorkbenchApp config={unicaWorkbench} />);
  expect(screen.getByText('Unica Workbench')).toBeTruthy();
  expect(container.querySelectorAll('.wb-artboard button[data-wb-subject]')).toHaveLength(6);

  fireEvent.click(screen.getByRole('button', { name: '120% Text' }));
  expect(container.querySelectorAll('.wb-artboard[data-text-scale="120"]')).toHaveLength(6);

  fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
  expect(container.querySelectorAll('.wb-artboard[dir="rtl"]')).toHaveLength(6);
});

it('emits valid Textarea JSX for uncontrolled and controlled log examples', async () => {
  const component = unicaWorkbench.components.find(({ id }) => id === 'textarea')!;
  const defaults = defaultValues(component.props);
  for (const values of [
    defaults,
    { ...defaults, useValue: true, useDefaultValue: false, wrap: 'off', status: 'danger' },
  ]) {
    const code = componentCode(component, values);
    const source = await format(code, { parser: 'babel', plugins: [babel, estree] });
    expect(source).toContain('<form>');
    expect(source).toContain(values.useValue ? 'value={value}' : 'defaultValue=');
  }
});

it('keeps Button and IconButton role and tone choices in sync with the JSX readout', () => {
  const specimen = unicaWorkbench.components.find(({ id }) => id === 'button')!;
  const Subject = specimen.render;
  const ctx = {
    id: 'button-contract',
    tab: 'playground',
    theme: unicaWorkbench.themes[0]!,
    surface: 'base',
    comparing: false,
    subject: { 'data-wb-subject': '' },
    form: { 'data-wb-form': '' },
    action: () => (): void => {},
  } as const;
  const initial = defaultValues(specimen.props);
  const { rerender } = render(<Subject ctx={ctx} values={initial} />);

  for (const content of ['text', 'icon']) {
    for (const variant of ['auto', 'primary', 'secondary', 'ghost']) {
      for (const tone of ['auto', 'accent', 'neutral', 'danger']) {
        const values = { ...initial, content, variant, tone };
        rerender(<Subject ctx={ctx} values={values} />);

        const role = variant === 'auto' ? (content === 'icon' ? 'secondary' : 'primary') : variant;
        const ink = tone === 'auto' ? (role === 'primary' ? 'accent' : 'neutral') : tone;
        const subject = screen.getByRole('button', { name: 'Create' });
        expect(subject.getAttribute('data-unica-button-variant')).toBe(role);
        expect(subject.getAttribute('data-unica-button-tone')).toBe(ink);

        const jsx = componentCode(specimen, values);
        expect(jsx).toContain(content === 'icon' ? '<IconButton ' : '<Button ');
        expect(jsx.match(/variant="([\w-]+)"/)?.[1]).toBe(variant === 'auto' ? undefined : variant);
        expect(jsx.match(/tone="([\w-]+)"/)?.[1]).toBe(tone === 'auto' ? undefined : tone);
      }
    }
  }
});

it('connects the Button inspector to the toggle authority and a real anchor host', () => {
  window.history.replaceState(null, '', '/?item=button&family=frost&scheme=dark');
  render(<WorkbenchApp config={unicaWorkbench} />);

  const command = () => screen.getByRole('button', { name: 'Create' });
  const jsx = () => screen.getByRole('region', { name: 'JSX' }).textContent;
  const host = screen.getByRole('checkbox', { name: 'asChild' });
  const toggle = screen.getByRole('combobox', { name: 'toggle' });
  expect(command().getAttribute('aria-pressed')).toBeNull();

  fireEvent.change(toggle, { target: { value: 'controlled' } });
  expect(command().getAttribute('aria-pressed')).toBe('false');
  expect(jsx()).toContain('pressed={pressed}');
  fireEvent.click(command());
  expect(command().getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('checkbox', { name: 'loading' }));
  fireEvent.click(command());
  expect(command().getAttribute('aria-pressed')).toBe('true');
  expect((host as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: 'loading' }));

  fireEvent.change(toggle, { target: { value: 'uncontrolled' } });
  expect(jsx()).toContain('defaultPressed={false}');
  fireEvent.click(command());
  expect(command().getAttribute('aria-pressed')).toBe('true');
  fireEvent.change(toggle, { target: { value: 'none' } });

  fireEvent.click(host);
  const link = screen.getByRole('link', { name: 'Create' });
  expect(link.tagName).toBe('A');
  expect(link.getAttribute('href')).toBe('/?item=02-workspace-overview');
  expect(jsx()).toContain('<a href="/?item=02-workspace-overview">Create</a>');
  expect(screen.getByRole<HTMLOptionElement>('option', { name: 'submit' }).disabled).toBe(true);
});

it('covers allowed Button combinations and exposes Pairwise availability rules', () => {
  const specimen = unicaWorkbench.components.find(({ id }) => id === 'button')!;
  const search = buildPairwise(specimen.props, specimen.constraints, {});
  let step = search.next();
  while (!step.done) {
    step = search.next();
  }
  const { rows } = step.value;
  for (const [key, prop] of Object.entries(specimen.props)) {
    for (const value of finiteDomain(prop)) {
      expect(
        rows.some((row) => row[key] === value),
        `${key}=${value}`,
      ).toBe(true);
    }
  }
  expect(rows.every((row) => evaluate(specimen.constraints, row).valid)).toBe(true);
  const square = rows.find((row) => row.content === 'icon' && row.width === 'full')!;
  const unavailable = rows.find((row) => row.disabled === true && row.loading === true)!;
  expect(evaluate(specimen.constraints, square).matches.map(({ kind }) => kind)).toContain(
    'ignored',
  );
  expect(evaluate(specimen.constraints, unavailable).matches.map(({ kind }) => kind)).toContain(
    'precedence',
  );
});

it('covers typography controls in Pairwise and renders only valid label bindings', () => {
  for (const id of ['text', 'title']) {
    const component = unicaWorkbench.components.find((entry) => entry.id === id)!;
    expect(component.status).toBe('UI');
    const search = buildPairwise(component.props, component.constraints, {});
    let step = search.next();
    while (!step.done) {
      step = search.next();
    }
    const rows = step.value.rows;
    for (const [key, prop] of Object.entries(component.props)) {
      for (const value of finiteDomain(prop)) {
        expect(
          rows.some((row) => row[key] === value),
          `${id}: ${key}=${value}`,
        ).toBe(true);
      }
    }

    expect(rows.every((row) => evaluate(component.constraints, row).valid)).toBe(true);
    const clamp = rows.find((row) => row.lineClamp === '1' && row.truncate === true)!;
    const { matches } = evaluate(component.constraints, clamp);
    expect(matches.some((rule) => rule.kind === 'precedence')).toBe(true);
    if (id === 'title') {
      expect(
        matches.some((rule) => rule.kind === 'ignored' && rule.affects.includes('textWrap')),
      ).toBe(true);
    } else {
      const linked = rows.filter((row) => row.htmlFor === 'field');
      expect(linked.length).toBeGreaterThan(0);
      expect(linked.every((row) => row.as === 'label')).toBe(true);
      const upright = { ...defaultValues(component.props), as: 'em', italic: 'normal' };
      expect(componentCode(component, upright)).toContain('italic={false}');
    }
  }
});

it('restores the material and case caption of a directly addressed RadioCard preview', () => {
  window.history.replaceState(null, '', '/?item=radio-card&tab=cases&block=overlay');
  const { container } = render(<WorkbenchApp config={unicaWorkbench} />);
  const artboards = [...container.querySelectorAll<HTMLElement>('.wb-artboard')];
  expect(artboards).toHaveLength(6);
  expect(artboards.every((artboard) => artboard.querySelector('[data-surface="overlay"]'))).toBe(
    true,
  );
  const caption = screen.getByText(/Choose who can open a page on the floating plate/);
  expect(caption.closest('.wb-artboard')).toBeNull();

  const chosen = (): number[] =>
    artboards.map((artboard) => artboard.querySelectorAll('input[type="radio"]:checked').length);
  expect(chosen()).toEqual([1, 1, 1, 1, 1, 1]);

  const choices = within(artboards[0]!).getAllByRole<HTMLInputElement>('radio');
  fireEvent.click(choices[1]!);
  expect(choices[1]?.checked).toBe(true);
  expect(chosen()).toEqual([1, 1, 1, 1, 1, 1]);
  expect(artboards[1]?.querySelectorAll('input[type="radio"]')[1]).not.toHaveProperty(
    'checked',
    true,
  );
});

it('uses the actual tag limit in the readout before and after an inspector edit', () => {
  window.history.replaceState(null, '', '/?item=tags-input&family=frost&scheme=dark');
  render(<WorkbenchApp config={unicaWorkbench} />);

  const jsx = screen.getByRole('region', { name: 'JSX' });
  const displayedLimits = (): string[] | null => jsx.textContent?.match(/maxTags=\{\d+\}/g) ?? null;
  expect(displayedLimits()).toEqual(['maxTags={5}']);

  const limit = screen.getByRole('spinbutton', { name: 'maxTags' });
  const draft = screen.getByRole('textbox', { name: 'Topics' });
  fireEvent.change(draft, { target: { value: 'Cartography' } });
  fireEvent.change(limit, { target: { value: '2.5' } });
  expect(displayedLimits()).toEqual(['maxTags={2}']);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Add tags' }).disabled).toBe(true);
  expect(screen.getByText('2 / 2')).toBeTruthy();

  fireEvent.change(limit, { target: { value: '-1' } });
  expect(displayedLimits()).toEqual(['maxTags={0}']);
  expect(screen.getByText('No tags can be added.')).toBeTruthy();
  expect(screen.getByText('2 / 0')).toBeTruthy();
  expect(draft).toHaveProperty('value', 'Cartography');
  fireEvent.keyDown(draft, { key: 'Enter' });
  expect(draft.getAttribute('aria-invalid')).toBe('true');
  fireEvent.change(limit, { target: { value: '3' } });
  expect(draft.getAttribute('aria-invalid')).toBeNull();
  expect(draft).toHaveProperty('value', 'Cartography');
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Add tags' }).disabled).toBe(false);
});

it('keeps src/workbench portable with zero app-specific imports or Unica token leaks', async () => {
  const workbenchDir = resolve(import.meta.dirname, 'workbench');
  const workbenchFiles = await collectFiles(workbenchDir, ['.ts', '.tsx', '.css']);
  expect(workbenchFiles.length).toBeGreaterThanOrEqual(3);

  const nonWorkbenchCustomProperty = /(?:^|[^\w-])--(?!wb-)[a-zA-Z_][a-zA-Z0-9_-]*/;
  const nonPortableImport =
    /['"][^'"]*(?:@docouno\/|\/(?:prototypes|specimens|scenes|packages)\/|\/unica\.)[^'"]*['"]/;
  for (const file of workbenchFiles) {
    const content = await readFile(file, 'utf8');
    expect(content, `${file} must have portable imports`).not.toMatch(nonPortableImport);
    expect(content, `${file} must only use --wb-* CSS custom properties`).not.toMatch(
      nonWorkbenchCustomProperty,
    );
  }

  const workbenchCss = await readFile(resolve(workbenchDir, 'workbench.css'), 'utf8');
  expect(workbenchCss).toContain(':where(.wb-artboard)');
  const bridgeCss = await readFile(resolve(import.meta.dirname, 'unica.workbench.css'), 'utf8');
  expect(bridgeCss).toContain('.wb-artboard[data-theme]');
});

it('configures the 4-tab Workbench architecture and resolves Markdown docs for every component', async () => {
  expect(unicaWorkbench.componentTabs?.map((tab) => [tab.id, tab.kind])).toEqual([
    ['playground', 'playground'],
    ['states', 'states'],
    ['compositions', 'compositions'],
    ['usage', 'usage'],
  ]);
  expect(unicaWorkbench.docs?.resolve).toBeDefined();

  for (const component of unicaWorkbench.components) {
    const source = unicaWorkbench.docs!.resolve!(component);
    expect(source, `Missing docs source for ${component.id}`).toBeDefined();
    expect(source?.markdown, `Missing Markdown loader for ${component.id}`).toBeDefined();
    if (component.status === 'UI') {
      expect(source?.importFrom, `Missing package importFrom for UI ${component.id}`).toBe(
        '@docouno/unica',
      );
      expect(source?.sourceLabel).toMatch(/^docs\/components\/.+\.md$/);
    } else {
      expect(source?.sourceLabel).toMatch(/^apps\/playground\/src\/prototypes\/.+\/README\.md$/);
    }
    const content =
      typeof source!.markdown === 'function' ? await source!.markdown() : source!.markdown!;
    expect(content.trim().length, `Empty Markdown doc for ${component.id}`).toBeGreaterThan(20);
  }

  // Every UI component's Usage Quick Start only imports symbols actually exported by @docouno/unica.
  const packageExports = new Set(Object.keys(UnicaPackage));
  expect(unicaWorkbench.docs?.exportedNames).toEqual(packageExports);
  for (const component of unicaWorkbench.components.filter((entry) => entry.status === 'UI')) {
    const { container, unmount } = render(
      <UsageView
        component={component}
        scenes={unicaWorkbench.scenes}
        docsConfig={unicaWorkbench.docs}
        raw
        itemHref={({ item }) => `/?item=${item}`}
        navigateItem={() => {}}
      />,
    );
    const snippet = container.querySelector('#wb-usage-quick-start pre')?.textContent ?? '';
    for (const match of snippet.matchAll(/import\s+\{([^}]+)\}\s+from\s+'@docouno\/unica'/g)) {
      const names = match[1]!.replace(/,\s*$/u, '').split(',');
      for (const name of names) {
        const symbol = name.trim();
        expect(
          packageExports.has(symbol),
          `Usage Quick Start for ${component.id} imports unknown symbol ${symbol}`,
        ).toBe(true);
      }
    }
    if (component.id === 'tooltip') {
      expect(snippet).toContain("import { Tooltip } from '@docouno/unica'");
      expect(snippet).not.toMatch(/import\s+\{[^}]*CopyIcon[^}]*\}/);
    } else if (component.id === 'stack') {
      expect(snippet).toMatch(/import\s+\{[^}]*\bStack\b[^}]*\}\s+from\s+'@docouno\/unica'/);
      expect(snippet).toMatch(/import\s+\{[^}]*\bText\b[^}]*\}\s+from\s+'@docouno\/unica'/);
      expect(snippet).toContain("import { Fragment } from 'react'");
      expect(snippet).not.toMatch(/import\s+\{[^}]*Fragment[^}]*\}\s+from\s+'@docouno\/unica'/);
    } else if (component.id === 'scrollbar') {
      expect(snippet).toContain("import '@docouno/unica/styles.css'");
      expect(snippet).not.toContain("from '@docouno/unica'");
    }
    unmount();
  }

  // Relative docs/components/*.md links from prototype READMEs resolve cleanly to Usage routes, while external URLs are never hijacked.
  const protoComponent = unicaWorkbench.components.find((entry) => entry.status === 'Proto')!;
  expect(
    unicaWorkbench.docs?.resolveDocLink?.(
      '../../../../../docs/components/tooltip.md',
      protoComponent,
    ),
  ).toEqual({ item: 'tooltip', tab: 'usage' });
  expect(
    unicaWorkbench.docs?.resolveDocLink?.(
      'https://example.com/docs/components/button.md',
      protoComponent,
    ),
  ).toBeUndefined();
});

it('keeps Unica theme editor tokens and macro outputs aligned with styles.css', async () => {
  const editor = unicaWorkbench.themeEditor;
  expect(editor).toBeDefined();

  const stylesCss = (
    await readFile(resolve(import.meta.dirname, '../../../packages/ui/src/styles.css'), 'utf8')
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  const declaredVars = new Set<string>();
  for (const match of stylesCss.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) {
    declaredVars.add(match[1]!);
  }

  for (const token of editor!.tokens) {
    expect(
      declaredVars.has(token.name),
      `Theme editor token ${token.name} missing in styles.css`,
    ).toBe(true);
  }
  for (const pair of editor!.contrastPairs ?? []) {
    expect(
      declaredVars.has(pair.foreground),
      `Contrast foreground ${pair.foreground} missing`,
    ).toBe(true);
    expect(
      declaredVars.has(pair.background),
      `Contrast background ${pair.background} missing`,
    ).toBe(true);
    if (pair.backdrop) {
      expect(declaredVars.has(pair.backdrop), `Contrast backdrop ${pair.backdrop} missing`).toBe(
        true,
      );
    }
  }

  // Every macro control must define on-step defaults for all 6 presets and emit valid declared CSS variables.
  const allMacroIds = new Set((editor!.macros ?? []).map((macro) => macro.id));
  for (const theme of unicaWorkbench.themes) {
    const sampleValues: Record<string, number | string> = {};
    for (const macro of editor!.macros ?? []) {
      const def = macro.defaults[theme.id];
      expect(def, `Missing macro default ${macro.id} for ${theme.id}`).toBeDefined();
      if (macro.kind === 'range') {
        const bounds = macroBoundsForTheme(macro, theme);
        const steps = (Number(def) - bounds.min) / bounds.step;
        expect(
          Math.abs(steps - Math.round(steps)),
          `Macro ${macro.id} default ${String(def)} for ${theme.id} is off-step`,
        ).toBeLessThan(1e-6);
        sampleValues[macro.id] = bounds.min;
      } else {
        sampleValues[macro.id] = macro.kind === 'color' ? '#ffd000' : macro.choices[0]!.value;
      }
    }
    const derived = editor!.computeMacros!(theme, sampleValues, allMacroIds);
    expect(Object.keys(derived).length).toBeGreaterThan(25);
    for (const [name, value] of Object.entries(derived)) {
      expect(declaredVars.has(name), `Macro output ${name} for ${theme.id} is not declared`).toBe(
        true,
      );
      expect(value.trim().length, `Empty macro value for ${name}`).toBeGreaterThan(0);
      expect(value, `Invalid NaN macro value for ${name}`).not.toContain('NaN');
    }

    // Nudging Layer Contrast on Soft Dark must preserve warm inks without snapping them cold.
    if (theme.id === 'soft-dark') {
      const contrastOnly = editor!.computeMacros!(
        theme,
        { neutralHue: 68, neutralChroma: 0.002, canvasDepth: 0.223, surfaceContrast: 1.05 },
        new Set(['surfaceContrast']),
      );
      expect(contrastOnly['--fg-primary']).toBeUndefined();
      expect(contrastOnly['--bg-surface']).toBeDefined();
    }

    // Nudging Neutral Hue on Light themes must keep near-white --fg-on-neutral without clamping dark.
    if (theme.id === 'soft-light') {
      const hueNudge = editor!.computeMacros!(
        theme,
        { neutralHue: 86, neutralChroma: 0.009, canvasDepth: 0.968, surfaceContrast: 1 },
        new Set(['neutralHue']),
      );
      expect(hueNudge['--fg-on-neutral']).toMatch(/^#f[cdef]/);
    }
  }
});

it('enforces semantic CSS in prototypes, specimens and scenes, including their live entrypoints', async () => {
  const srcDir = import.meta.dirname;
  const uiSrcDir = resolve(srcDir, '../../../packages/ui/src');
  const allowedUtilityClasses = new Set([
    'unica-overlay-surface',
    'unica-scrollbar',
    'unica-scrollbar--compact',
    'unica-visually-hidden',
  ]);

  const themePrivateVars = new Set<string>();
  const stylesCss = (await readFile(resolve(uiSrcDir, 'styles.css'), 'utf8')).replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  for (const match of stylesCss.matchAll(/(--_[a-z0-9-]+)\s*:/g)) {
    themePrivateVars.add(match[1]!);
  }

  const componentPrivateVars = new Set<string>();
  for (const folder of ['components', 'internal'] as const) {
    const cssFiles = await collectFiles(resolve(uiSrcDir, folder), ['.css']);
    for (const cssFile of cssFiles) {
      const css = (await readFile(cssFile, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/(--_[a-z0-9-]+)\s*:/g)) {
        if (!themePrivateVars.has(match[1]!)) {
          componentPrivateVars.add(match[1]!);
        }
      }
      for (const match of css.matchAll(/var\(\s*(--_[a-z0-9-]+)/g)) {
        if (!themePrivateVars.has(match[1]!)) {
          componentPrivateVars.add(match[1]!);
        }
      }
    }
  }
  expect(componentPrivateVars.size).toBeGreaterThan(0);

  for (const [folder, entry] of [
    ['prototypes', '.proto.tsx'],
    ['specimens', '.spec.tsx'],
    ['scenes', '.scene.tsx'],
  ] as const) {
    const files = await collectFiles(resolve(srcDir, folder), ['.css', '.ts', '.tsx']);
    expect(
      files.some((file) => file.endsWith(entry)),
      `${folder} must have entrypoints`,
    ).toBe(true);

    for (const file of files) {
      const raw = await readFile(file, 'utf8');
      expect(raw, `${file} must not branch on data-theme`).not.toMatch(/\bdata-theme\b/);
      const strippedComments = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(
        strippedComments,
        `${file} must use semantic CSS tokens instead of raw #hex`,
      ).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);

      const leakedClasses = [...strippedComments.matchAll(/(?<![a-zA-Z0-9_-])unica-[a-z0-9-]+/g)]
        .map((match) => match[0])
        .filter((name) => !allowedUtilityClasses.has(name));
      expect(leakedClasses, `${file} must not depend on internal .unica-* classes`).toEqual([]);

      if (folder === 'scenes') {
        expect(
          strippedComments,
          `${file} must not read private var(--_*) tokens in scenes`,
        ).not.toMatch(/var\(\s*--_[a-z0-9-]+/);
      } else {
        const leakedPrivateVars = [...strippedComments.matchAll(/--_[a-z0-9-]+/g)]
          .map((match) => match[0])
          .filter((name) => componentPrivateVars.has(name));
        expect(
          leakedPrivateVars,
          `${file} must not depend on shipped component private --_* variables`,
        ).toEqual([]);
      }
    }
  }
});

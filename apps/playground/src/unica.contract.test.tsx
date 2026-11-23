import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import { format } from 'prettier/standalone';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { unicaWorkbench } from './unica.workbench.js';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';
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
    await expect(format(code, { parser: 'babel', plugins: [babel, estree] })).resolves.toContain(
      '<>',
    );
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
  const caption = screen.getByText(/Static floating plate with live inputs/);
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

  fireEvent.change(screen.getByRole('spinbutton', { name: 'maxTags' }), {
    target: { value: '2' },
  });
  expect(displayedLimits()).toEqual(['maxTags={2}']);
});

it('keeps src/workbench portable with zero app-specific imports or Unica token leaks', async () => {
  const workbenchDir = resolve(import.meta.dirname, 'workbench');
  const workbenchFiles = await collectFiles(workbenchDir, ['.ts', '.tsx', '.css']);
  expect(workbenchFiles.length).toBeGreaterThanOrEqual(3);

  const nonWorkbenchCustomProperty = /(?:^|[^\w-])--(?!wb-)[a-z][a-z0-9-]*/;
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

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { unicaWorkbench } from './unica.workbench.js';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';
import { validateCatalog } from './workbench/schema.js';

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

it('discovers real Proto and scene entries and renders six themed Subjects', () => {
  expect(() => validateCatalog(unicaWorkbench)).not.toThrow();
  expect(unicaWorkbench.themes).toHaveLength(6);
  expect(unicaWorkbench.components.find(({ id }) => id === 'button')?.status).toBe('Proto');
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
    }
  }
});

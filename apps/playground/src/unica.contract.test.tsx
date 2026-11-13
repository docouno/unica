import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { THEME_PRESETS } from '@docouno/unica';
import { unicaWorkbench } from './unica.workbench.js';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';
import { defineScene, defineSpecimen } from './workbench/types.js';
import type { WorkbenchConfig } from './workbench/types.js';

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
  try {
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
  } catch {
    return [];
  }
}

it('renders the Unica Workbench across all 6 presets and toggles focus/stress controls', () => {
  expect(unicaWorkbench.themes).toHaveLength(6);
  const { container } = render(<WorkbenchApp config={unicaWorkbench} />);

  expect(screen.getByText('Unica Workbench')).toBeTruthy();
  expect(screen.getByText('6-up Matrix')).toBeTruthy();
  expect(screen.getByText('Live Focus')).toBeTruthy();

  const artboards = container.querySelectorAll('.wb-artboard');
  expect(artboards).toHaveLength(6);

  fireEvent.click(screen.getByText('120% Text'));
  expect(container.querySelector('.wb-artboard[data-text-scale="120"]')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
  expect(container.querySelector('.wb-artboard[dir="rtl"]')).toBeTruthy();

  fireEvent.click(screen.getByText('Live Focus'));
  expect(container.querySelectorAll('.wb-artboard')).toHaveLength(1);
});

it('supports Auto/Base/Overlay surface overrides and respects SceneDefinition.defaultViewport', () => {
  const overlaySpecimen = defineSpecimen({
    id: 'overlay-popover',
    title: 'Overlay Popover',
    group: 'Overlays',
    defaultSurface: 'overlay',
    sections: [
      {
        id: 'matrix',
        title: 'Overlay matrix',
        kind: 'matrix',
        render: () => <span>Overlay Specimen Node</span>,
      },
    ],
  });

  const wideScene = defineScene({
    id: '01-wide-scene',
    title: '01 · Wide Scene',
    group: 'Folio',
    defaultViewport: 1440,
    render: () => <span>Wide Scene Node</span>,
  });

  const syntheticConfig: WorkbenchConfig = {
    ...unicaWorkbench,
    themes: THEME_PRESETS,
    specimens: [overlaySpecimen],
    scenes: [wideScene],
  };

  const { container } = render(<WorkbenchApp config={syntheticConfig} />);
  expect(screen.getAllByText('Overlay Specimen Node')).toHaveLength(6);
  expect(container.querySelectorAll('[data-surface="overlay"]').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Base' }));
  expect(container.querySelectorAll('[data-surface="overlay"]')).toHaveLength(0);

  fireEvent.click(screen.getByText('01 · Wide Scene'));
  fireEvent.click(screen.getByText('Live Focus'));
  const frameInner = container.querySelector<HTMLElement>('.wb-viewport-inner');
  expect(frameInner?.style.width).toBe('1440px');
  expect(frameInner?.style.maxWidth).toBe('');

  cleanup();
  window.history.replaceState(null, '', '/?item=01-wide-scene&mode=focus');
  const direct = render(<WorkbenchApp config={syntheticConfig} />);
  const directInner = direct.container.querySelector<HTMLElement>('.wb-viewport-inner');
  expect(directInner?.style.width).toBe('1440px');

  const autoBtn = direct.getByRole('group', { name: 'Container viewport' }).firstElementChild;
  if (autoBtn) {
    fireEvent.click(autoBtn);
  }
  expect(direct.container.querySelector('.wb-viewport-inner')).toBeNull();
});

it('keeps src/workbench portable with zero @docouno references or Unica CSS token leaks', async () => {
  const workbenchDir = resolve(import.meta.dirname, 'workbench');
  const workbenchFiles = await collectFiles(workbenchDir, ['.ts', '.tsx', '.css']);
  expect(workbenchFiles.length).toBeGreaterThanOrEqual(3);

  const nonWorkbenchCustomProperty = /(?:^|[^\w-])--(?!wb-)[a-z][a-z0-9-]*/;

  for (const file of workbenchFiles) {
    const content = await readFile(file, 'utf8');
    expect(content, `${file} must not reference @docouno/*`).not.toContain('@docouno/');
    expect(content, `${file} must only use --wb-* CSS custom properties`).not.toMatch(
      nonWorkbenchCustomProperty,
    );
  }

  const workbenchCss = await readFile(resolve(workbenchDir, 'workbench.css'), 'utf8');
  expect(workbenchCss).toContain(':where(.wb-artboard)');
  expect(workbenchCss).toContain(":where(.wb-artboard[data-color-scheme='light'])");
  expect(workbenchCss).toContain(":where(.wb-artboard[data-text-scale='120'])");

  const bridgeCss = await readFile(resolve(import.meta.dirname, 'unica.workbench.css'), 'utf8');
  expect(bridgeCss).toContain('.wb-artboard[data-theme]');
});

it('enforces zero [data-theme] selectors and zero raw hex literals in prototype/scene files', async () => {
  const srcDir = import.meta.dirname;
  const files = [
    ...(await collectFiles(resolve(srcDir, 'prototypes'), ['.css', '.ts', '.tsx'])),
    ...(await collectFiles(resolve(srcDir, 'scenes'), ['.css', '.ts', '.tsx'])),
  ];

  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    expect(raw, `${file} must not branch on data-theme`).not.toMatch(/\bdata-theme\b/);
    const strippedComments = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(
      strippedComments,
      `${file} must use semantic CSS tokens instead of raw #hex`,
    ).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  }
});

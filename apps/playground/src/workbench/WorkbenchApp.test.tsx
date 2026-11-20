import { StrictMode, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WorkbenchApp } from './WorkbenchApp.js';
import { readRoute, routeSearch } from './route.js';
import { defineComponent, defineScene } from './types.js';
import type { WorkbenchConfig } from './types.js';

const field = defineComponent({
  id: 'field',
  title: 'Field',
  category: 'Controls',
  status: 'Proto',
  props: {},
  matrixViews: [{ id: 'basic', title: 'Basic' }],
  cases: [
    { id: 'overflow', title: 'Overflow', kind: 'content', render: () => <span>Long text</span> },
  ],
  render: ({ ctx }) => <input {...ctx.subject} aria-label="Test field" />,
});

const stamp = defineComponent({
  id: 'label',
  title: 'Stamp',
  category: 'Text',
  status: 'UI',
  props: {},
  render: () => <span>Stamp sample</span>,
});

const scene = defineScene({
  id: 'example-scene',
  title: 'Example scene',
  group: 'Examples',
  defaultViewport: 1440,
  uses: ['field'],
  render: function ExampleScene() {
    const [edited, setEdited] = useState(false);
    return (
      <div role="alertdialog" aria-label="Scene confirmation">
        <button type="button" onClick={() => setEdited(true)}>
          Scene action
        </button>
        <p>{edited ? 'Edited scene' : 'Initial scene'}</p>
        <input aria-label="Scene title" defaultValue="Initial title" />
      </div>
    );
  },
});

const config: WorkbenchConfig = {
  title: 'Example Workbench',
  categories: ['Controls', 'Text'],
  themes: [
    { id: 'night', label: 'Haze Night', family: 'haze', familyLabel: 'Haze', colorScheme: 'dark' },
    { id: 'day', label: 'Haze Day', family: 'haze', familyLabel: 'Haze', colorScheme: 'light' },
    {
      id: 'contrast',
      label: 'Ink Contrast',
      family: 'ink',
      familyLabel: 'Ink',
      colorScheme: 'dark',
    },
    {
      id: 'slate',
      label: 'Slate Night',
      family: 'slate',
      familyLabel: 'Slate',
      colorScheme: 'dark',
    },
    {
      id: 'paper',
      label: 'Paper Day',
      family: 'paper',
      familyLabel: 'Paper',
      colorScheme: 'light',
    },
  ],
  components: [field, stamp],
  scenes: [scene],
};

function open(search = '/'): ReturnType<typeof render> {
  window.history.replaceState(null, '', search);
  return render(
    <StrictMode>
      <WorkbenchApp config={config} />
    </StrictMode>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

it('normalizes v2 routes using definitions and ignores stale v1 switches', () => {
  expect(readRoute('?item=field&theme=day&section=basic&mode=focus', config)).toMatchObject({
    item: 'field',
    family: 'all',
    scheme: 'both',
    tab: 'playground',
    mode: 'slice',
  });
  expect(readRoute('?item=field&mode=pairwise&slice=basic', config)).toMatchObject({
    tab: 'matrix',
    slice: 'basic',
    mode: 'pairwise',
  });
  expect(
    readRoute('?item=field&tab=usage&mode=full&slice=basic&block=missing', config),
  ).toMatchObject({
    tab: 'usage',
    mode: 'slice',
    slice: undefined,
    block: undefined,
  });
  const caseRoute = readRoute(
    '?item=field&tab=cases&block=overflow&family=ink&scheme=light&vp=360',
    config,
  );
  expect(caseRoute).toMatchObject({
    tab: 'cases',
    block: 'overflow',
    family: 'ink',
    scheme: 'both',
    vp: 360,
  });
  expect(routeSearch(caseRoute, config)).toBe(
    '?item=field&tab=cases&family=ink&block=overflow&vp=360',
  );
  expect(readRoute('?item=example-scene&tab=matrix&bounds=1', config)).toMatchObject({
    vp: 1440,
    tab: 'playground',
    bounds: false,
  });
  expect(readRoute('?item=example-scene&vp=auto', config).vp).toBe('auto');
});

it('filters sparse theme axes independently and isolates an artboard with native Back', async () => {
  const { container } = open();
  const themeLayers = (): (string | null)[] =>
    Array.from(container.querySelectorAll('.wb-artboard'), (element) =>
      element.getAttribute('data-theme'),
    );
  const family = within(screen.getByRole('group', { name: 'Family' }));
  const scheme = within(screen.getByRole('group', { name: 'Scheme' }));

  expect(themeLayers()).toEqual(['night', 'day', 'contrast', 'slate', 'paper']);
  fireEvent.click(scheme.getByRole('link', { name: 'Dark' }));
  expect(themeLayers()).toEqual(['night', 'contrast', 'slate']);
  expect(family.getByRole('button', { name: 'Paper' }).hasAttribute('disabled')).toBe(true);

  fireEvent.click(family.getByRole('link', { name: 'Haze' }));
  fireEvent.click(scheme.getByRole('link', { name: 'Both' }));
  expect(themeLayers()).toEqual(['night', 'day']);

  const push = vi.spyOn(window.history, 'pushState');
  fireEvent.click(screen.getByRole('button', { name: 'Isolate Haze Day' }));
  expect(themeLayers()).toEqual(['day']);
  expect(push).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Isolate Haze Day' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Haze Day' }));
  window.history.back();
  await waitFor(() => {
    expect(themeLayers()).toEqual(['night', 'day']);
  });
  expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Haze Day' }));
  expect(push).toHaveBeenCalledTimes(1);
});

it('returns from a scene to the same Usage context through actual browser history', async () => {
  const { container } = open('/?item=field&family=haze&scheme=light');
  const push = vi.spyOn(window.history, 'pushState');
  fireEvent.click(screen.getByRole('button', { name: '120% Text' }));
  fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
  expect(push).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('link', { name: 'Usage' }));
  const sceneLink = within(screen.getByRole('navigation', { name: 'Consuming scenes' })).getByRole(
    'link',
    { name: scene.title },
  );
  expect(sceneLink.getAttribute('href')).toContain('item=example-scene');
  fireEvent.click(sceneLink);

  expect(screen.queryByRole('navigation', { name: 'Inspector tabs' })).toBeNull();
  expect(container.querySelector<HTMLElement>('.wb-viewport-inner')?.style.width).toBe('1440px');
  expect(push).toHaveBeenCalledTimes(2);

  window.history.back();
  await waitFor(() => {
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBe('page');
  });
  expect(
    container.querySelector('.wb-artboard[data-theme="day"][dir="rtl"][data-text-scale="120"]'),
  ).toBeTruthy();

  window.history.forward();
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: scene.title })).toBeTruthy();
  });
  expect(push).toHaveBeenCalledTimes(2);
});

it('resets every visible scene instance while keeping the current view and focus', () => {
  const { container } = open('/?item=example-scene&family=haze&vp=360&scale=120&dir=rtl');
  const href = window.location.href;
  const historyLength = window.history.length;
  const boards = screen.getAllByRole('region', { name: /^Haze / }).map((board) => within(board));
  expect(container.querySelectorAll('[data-wb-scene-frame]')).toHaveLength(2);

  for (const board of boards) {
    fireEvent.click(board.getByRole('button', { name: 'Scene action' }));
    fireEvent.change(board.getByRole('textbox', { name: 'Scene title' }), {
      target: { value: 'Edited title' },
    });
    expect(board.getByText('Edited scene')).toBeTruthy();
  }

  const reset = screen.getByRole('button', { name: 'Reset scene' });
  reset.focus();
  fireEvent.click(reset);

  for (const board of boards) {
    expect(board.getByText('Initial scene')).toBeTruthy();
    expect(board.getByRole<HTMLInputElement>('textbox', { name: 'Scene title' }).value).toBe(
      'Initial title',
    );
  }
  expect(window.location.href).toBe(href);
  expect(window.history.length).toBe(historyLength);
  expect(document.activeElement).toBe(reset);
});

it('searches by id and category while preserving scene access and editable shortcuts', () => {
  open('/?item=field&family=haze&scheme=light');
  const catalog = within(screen.getByRole('navigation', { name: 'Components and scenes' }));
  const search = screen.getByRole('searchbox');
  const subject = screen.getByRole('textbox', { name: 'Test field' });

  subject.focus();
  expect(fireEvent.keyDown(subject, { key: '/' })).toBe(true);
  expect(document.activeElement).toBe(subject);
  expect(fireEvent.keyDown(subject, { key: 'k', ctrlKey: true })).toBe(false);
  expect(document.activeElement).toBe(search);

  fireEvent.change(search, { target: { value: 'controls' } });
  expect(catalog.getByRole('link', { name: 'Field Proto' })).toBeTruthy();
  expect(catalog.queryByRole('link', { name: 'Stamp UI' })).toBeNull();
  fireEvent.change(search, { target: { value: 'label' } });
  expect(catalog.getByRole('link', { name: 'Stamp UI' })).toBeTruthy();
  fireEvent.change(search, { target: { value: '' } });
  const filters = within(screen.getByRole('group', { name: 'Component status' }));
  fireEvent.click(filters.getByRole('button', { name: 'UI' }));
  expect(catalog.queryByRole('link', { name: 'Field Proto' })).toBeNull();
  fireEvent.click(catalog.getByRole('link', { name: scene.title }));
  const modalAction = screen.getByRole('button', { name: 'Scene action' });
  modalAction.focus();
  expect(fireEvent.keyDown(modalAction, { key: '/' })).toBe(true);
  expect(document.activeElement).toBe(modalAction);
  expect(fireEvent.keyDown(modalAction, { key: 'k', ctrlKey: true })).toBe(true);
  expect(document.activeElement).toBe(modalAction);
});

it('opens an unknown item with navigation and renders raw only for the requested block', () => {
  open('/?item=missing');
  expect(screen.getByRole('heading', { name: 'Item not found' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Field Proto' })).toBeTruthy();
  cleanup();
  const { container } = open('/?item=field&tab=cases&block=overflow&raw=1');
  expect(screen.queryByRole('navigation', { name: 'Components and scenes' })).toBeNull();
  expect(container.querySelector('.wb-raw-canvas')?.getAttribute('data-wb-block')).toBe('overflow');
  expect(screen.getAllByText('Long text')).toHaveLength(5);
});

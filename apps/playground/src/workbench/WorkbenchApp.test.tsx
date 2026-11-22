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
  summary: 'Field summary from the catalog.',
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
      <>
        <div role="alertdialog" aria-label="Scene confirmation">
          <button type="button" onClick={() => setEdited(true)}>
            Scene action
          </button>
          <p>{edited ? 'Edited scene' : 'Initial scene'}</p>
          <input aria-label="Scene title" defaultValue="Initial title" />
        </div>
        <dialog open role="presentation">
          <input aria-label="Dock field" />
          <button type="button">Dock action</button>
        </dialog>
      </>
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

it('keeps preview settings in the header and view settings in the inspector', () => {
  open('/?item=field&family=haze&scheme=light');
  const inspector = within(screen.getByRole('complementary', { name: 'Workbench inspector' }));
  const workspace = within(screen.getByRole('main'));
  const views = within(screen.getByRole('navigation', { name: 'Inspector tabs' }));
  const header = within(screen.getByRole('banner'));
  const previewSettings = within(header.getByRole('group', { name: 'Preview settings' }));
  const family = previewSettings.getByRole('group', { name: 'Family' });

  expect(screen.getByRole('heading', { name: 'Field' })).toBeTruthy();
  expect(inspector.queryByRole('group', { name: 'Family' })).toBeNull();
  expect(screen.queryByText(field.summary!)).toBeNull();
  expect(inspector.getByRole('region', { name: 'JSX' })).toBeTruthy();
  expect(workspace.queryByRole('region', { name: 'JSX' })).toBeNull();

  fireEvent.click(views.getByRole('link', { name: 'Matrix' }));
  expect(previewSettings.getByRole('group', { name: 'Family' })).toBe(family);
  expect(inspector.getByRole('region', { name: 'Matrix settings' })).toBeTruthy();
  expect(inspector.getByRole('combobox', { name: 'Slice' })).toBeTruthy();
  expect(workspace.queryByRole('combobox', { name: 'Slice' })).toBeNull();
  expect(workspace.getByRole('region', { name: 'Component matrix' })).toBeTruthy();

  fireEvent.click(views.getByRole('link', { name: 'Cases' }));
  expect(previewSettings.getByRole('group', { name: 'Family' })).toBe(family);
  expect(inspector.getByRole('combobox', { name: 'Case' })).toBeTruthy();
  expect(workspace.queryByRole('combobox', { name: 'Case' })).toBeNull();
  expect(inspector.queryByRole('region', { name: 'Matrix settings' })).toBeNull();
});

it('applies the selected width to the frame and its viewport without changing the theme', () => {
  const { container } = open('/?item=field&family=haze&scheme=light');
  const input = screen.getByLabelText<HTMLInputElement>('Test field');
  fireEvent.change(input, { target: { value: 'Keep this edit' } });
  const previewSettings = screen.getByRole('group', { name: 'Preview settings' });
  const width = within(previewSettings).getByRole('combobox', { name: 'Width' });
  const shell = container.querySelector<HTMLElement>('.wb-shell')!;
  const grid = container.querySelector('.wb-artboards')!;

  fireEvent.change(width, { target: { value: '360' } });
  expect(shell.style.getPropertyValue('--wb-preview-width')).toBe('360px');
  expect(grid.getAttribute('data-wb-fixed')).toBe('true');
  expect(grid.getAttribute('data-single')).toBe('true');
  expect(grid.querySelector<HTMLElement>('.wb-viewport-inner')?.style.width).toBe('360px');
  expect(grid.querySelector('.wb-artboard')?.getAttribute('data-theme')).toBe('day');

  fireEvent.change(width, { target: { value: 'auto' } });
  expect(shell.style.getPropertyValue('--wb-preview-width')).toBe('');
  expect(grid.hasAttribute('data-wb-fixed')).toBe(false);
  expect(screen.getByLabelText('Test field')).toBe(input);
  expect(input.value).toBe('Keep this edit');
});

it('keeps dark and light together and preserves the same artboard when isolating', () => {
  const { container } = render(
    <WorkbenchApp
      config={{
        ...config,
        themes: [config.themes[1]!, ...config.themes.filter((_, index) => index !== 1)],
      }}
    />,
  );
  const pair = container.querySelector('.wb-theme-slot[data-wb-pair]')!;
  expect(
    [...pair.querySelectorAll('.wb-artboard')].map((board) => board.getAttribute('data-theme')),
  ).toEqual(['night', 'day']);

  const day = screen.getByRole('region', { name: 'Haze Day' });
  fireEvent.click(within(day).getByRole('button', { name: 'Isolate Haze Day' }));
  expect(screen.getByRole('region', { name: 'Haze Day' })).toBe(day);
  expect(container.querySelector('.wb-theme-slot')).toBe(pair);
  expect(container.querySelectorAll('.wb-cell')).toHaveLength(1);
  expect(pair.hasAttribute('data-wb-pair')).toBe(false);
});

it('preserves inspected matrix rows on isolation and bounds work when the selection expands', () => {
  const sample = vi.fn(() => <input aria-label="Cell value" />);
  const reference = vi.fn(() => <span>Reference</span>);
  const axis = (count: number) => ({
    kind: 'enum' as const,
    group: 'Geometry',
    description: 'Coordinate.',
    choices: Array.from({ length: count }, (_, i) => ({ value: String(i) })),
    default: '0',
  });
  const matrix = defineComponent({
    ...field,
    props: { row: axis(4), col: axis(3) },
    matrixViews: [{ id: 'basic', title: 'Basic', rows: 'row', cols: 'col', reference }],
    render: sample,
  });
  window.history.replaceState(null, '', '/?item=field&tab=matrix&scheme=dark');
  render(<WorkbenchApp config={{ ...config, components: [matrix] }} />);
  const board = within(screen.getByRole('region', { name: 'Haze Night' }));
  const cells = () => board.getAllByRole<HTMLInputElement>('textbox', { name: 'Cell value' });
  expect(cells()).toHaveLength(3);
  fireEvent.click(board.getByRole('button', { name: /Show more rows/ }));
  const edited = cells()[3]!;
  fireEvent.change(edited, { target: { value: 'Keep this edit' } });
  sample.mockClear();
  reference.mockClear();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'field' } });
  fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
  fireEvent.click(screen.getByRole('button', { name: '120% Text' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Width' }), { target: { value: '360' } });
  expect(sample).not.toHaveBeenCalled();
  expect(reference).not.toHaveBeenCalled();
  expect(cells()[3]).toBe(edited);
  fireEvent.click(board.getByRole('button', { name: 'Isolate Haze Night' }));
  expect(cells()[3]).toBe(edited);
  expect(edited.value).toBe('Keep this edit');
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Family' })).getByRole('link', { name: 'All' }),
  );
  expect(cells()).toHaveLength(3);
  expect(screen.getAllByRole('textbox', { name: 'Cell value' })).toHaveLength(9);
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
  expect(container.querySelectorAll('.wb-cell > .wb-cell-header')).toHaveLength(2);

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
  fireEvent.click(catalog.getByRole('button', { name: 'Scenes' }));
  fireEvent.click(catalog.getByRole('button', { name: scene.group }));
  fireEvent.click(catalog.getByRole('link', { name: scene.title }));
  const modalAction = screen.getByRole('button', { name: 'Scene action' });
  modalAction.focus();
  expect(fireEvent.keyDown(modalAction, { key: '/' })).toBe(true);
  expect(document.activeElement).toBe(modalAction);
  expect(fireEvent.keyDown(modalAction, { key: 'k', ctrlKey: true })).toBe(true);
  expect(document.activeElement).toBe(modalAction);

  const dockField = screen.getByRole('textbox', { name: 'Dock field' });
  dockField.focus();
  expect(fireEvent.keyDown(dockField, { key: '/' })).toBe(true);
  expect(document.activeElement).toBe(dockField);
  expect(fireEvent.keyDown(dockField, { key: 'k', ctrlKey: true })).toBe(false);
  expect(document.activeElement).toBe(search);

  const dockAction = screen.getByRole('button', { name: 'Dock action' });
  dockAction.focus();
  expect(fireEvent.keyDown(dockAction, { key: '/' })).toBe(false);
  expect(document.activeElement).toBe(search);
});

it('keeps catalog groups collapsible and reveals the active path after navigation', async () => {
  open('/?item=field&family=haze&scheme=light');
  const catalog = within(screen.getByRole('navigation', { name: 'Components and scenes' }));
  const controls = catalog.getByRole('button', { name: 'Controls' });
  const scenes = catalog.getByRole('button', { name: 'Scenes' });
  const search = screen.getByRole('searchbox');

  expect(controls.getAttribute('aria-expanded')).toBe('true');
  expect(scenes.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(controls);
  expect(catalog.queryByRole('link', { name: 'Field Proto' })).toBeNull();

  fireEvent.change(search, { target: { value: 'field' } });
  expect(catalog.getByRole('link', { name: 'Field Proto' })).toBeTruthy();
  fireEvent.click(controls);
  expect(catalog.queryByRole('link', { name: 'Field Proto' })).toBeNull();
  fireEvent.change(search, { target: { value: '' } });
  expect(controls.getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(screen.getByRole('link', { name: 'Usage' }));
  fireEvent.change(search, { target: { value: scene.title } });
  fireEvent.click(catalog.getByRole('button', { name: scene.group }));
  expect(catalog.queryByRole('link', { name: scene.title })).toBeNull();
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Consuming scenes' })).getByRole('link', {
      name: scene.title,
    }),
  );
  expect(catalog.getByRole('button', { name: 'Scenes' }).getAttribute('aria-expanded')).toBe(
    'true',
  );
  expect(catalog.getByRole('button', { name: scene.group }).getAttribute('aria-expanded')).toBe(
    'true',
  );
  expect(catalog.getByRole('link', { name: scene.title }).getAttribute('aria-current')).toBe(
    'page',
  );

  fireEvent.change(search, { target: { value: '' } });
  window.history.back();
  await waitFor(() => {
    expect(catalog.getByRole('button', { name: 'Controls' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(catalog.getByRole('link', { name: 'Field Proto' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });
});

it('opens an unknown item with navigation and renders raw only for the requested block', () => {
  open('/?item=missing');
  expect(screen.getByRole('heading', { name: 'Item not found' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Controls' }));
  expect(screen.getByRole('link', { name: 'Field Proto' })).toBeTruthy();
  cleanup();
  const { container } = open('/?item=field&tab=cases&block=overflow&raw=1');
  expect(screen.queryByRole('navigation', { name: 'Components and scenes' })).toBeNull();
  expect(container.querySelector('.wb-raw-canvas')?.getAttribute('data-wb-block')).toBe('overflow');
  expect(screen.queryByRole('complementary', { name: 'Workbench inspector' })).toBeNull();
  expect(screen.getAllByText('Long text')).toHaveLength(5);
  const story = container.querySelector('.wb-story-frame[data-wb-block="overflow"]');
  expect(story?.querySelector('.wb-frame-heading h3')?.textContent).toBe('Overflow');
  expect(story?.querySelectorAll('.wb-artboard')).toHaveLength(5);
});

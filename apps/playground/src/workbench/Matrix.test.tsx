import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Matrix } from './Matrix.js';
import { defineComponent } from './types.js';
import type { ComponentDefinition, MatrixMode, WorkbenchTheme } from './types.js';

afterEach(cleanup);

const fixture = {
  group: 'Appearance',
  description: 'Example value.',
};

const grouped = defineComponent({
  id: 'button',
  title: 'Button',
  category: 'Actions',
  status: 'Proto',
  props: {
    a: { ...fixture, label: 'A', kind: 'boolean', default: false },
    b: { ...fixture, label: 'B', kind: 'boolean', default: false },
    c: { ...fixture, label: 'C', kind: 'boolean', default: false },
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { a: true, c: true },
      affects: [{ key: 'b', value: true }],
      reason: 'The component cannot render all three features together.',
    },
    {
      kind: 'ignored',
      when: { a: true, c: true },
      affects: ['b'],
      reason: 'This setting has no effect in this state.',
    },
    {
      kind: 'precedence',
      when: { a: true, c: true },
      affects: ['b'],
      reason: 'A takes precedence.',
    },
  ],
  states: [
    {
      id: 'features',
      title: 'Features',
      caption: 'Compare the component features.',
      rows: 'a',
      cols: 'b',
      group: 'c',
      surface: 'overlay',
    },
  ],
  render: ({ values: { a, b, c }, ctx }) => (
    <button type="button" {...ctx.subject}>
      {JSON.stringify({ a, b, c })}
    </button>
  ),
});

function wide(rows: number, cols: number): ComponentDefinition {
  const choices = (size: number) =>
    Array.from({ length: size }, (_, index) => ({ value: String(index) }));
  return defineComponent({
    id: 'palette',
    title: 'Palette',
    category: 'Actions',
    status: 'Proto',
    props: {
      a: { ...fixture, kind: 'enum', choices: choices(rows), default: '0' },
      b: { ...fixture, kind: 'enum', choices: choices(cols), default: '0' },
    },
    constraints: [
      {
        kind: 'forbidden',
        when: { a: '1' },
        affects: [{ key: 'b', value: '1' }],
        reason: 'This coordinate is unavailable.',
      },
    ],
    render: ({ values: { a, b }, ctx }) => (
      <span {...ctx.subject}>
        {a}/{b}
      </span>
    ),
  });
}

const theme: WorkbenchTheme = {
  id: 'preset',
  label: 'Preset',
  family: 'family',
  familyLabel: 'Family',
  colorScheme: 'light',
};

function MatrixFixture({
  definition = grouped,
  themeCount = 1,
  initialMode = 'slice',
  raw = false,
}: {
  readonly definition?: ComponentDefinition;
  readonly themeCount?: number;
  readonly initialMode?: MatrixMode;
  readonly raw?: boolean;
}): ReactElement {
  const [mode, setMode] = useState(initialMode);
  const [slice, setSlice] = useState<string>();
  const Demo = definition.render;
  const context = {
    id: 'test',
    theme,
    surface: 'base' as const,
    tab: 'states' as const,
    comparing: themeCount > 1,
    subject: { 'data-wb-subject': '' as const },
    form: { 'data-wb-form': '' as const },
    action: () => () => {},
  };
  return (
    <Matrix
      component={definition}
      slice={slice}
      mode={mode}
      raw={raw}
      themes={Array.from({ length: themeCount }, () => theme)}
      onSliceChange={setSlice}
      onModeChange={setMode}
      renderArtboards={(draw) => (
        <>
          {Array.from({ length: themeCount }, (_, index) => (
            <div key={index}>{draw(theme)}</div>
          ))}
        </>
      )}
      renderSubject={(_theme, values, _identity, view, story) => (
        <Demo
          values={values}
          ctx={{ ...context, surface: view?.surface ?? 'base', ...(story ? { story } : {}) }}
        />
      )}
    />
  );
}

it('renders an addressable grouped slice and explains forbidden cells', () => {
  const { container } = render(<MatrixFixture />);
  const subjects = () => container.querySelectorAll('[data-wb-subject]');
  expect(screen.getAllByRole('table')).toHaveLength(2);
  expect(screen.getByRole('heading', { name: 'Features' })).toBeTruthy();
  expect(screen.getByText('Compare the component features.')).toBeTruthy();
  expect(subjects()).toHaveLength(7);

  const forbidden = screen.getByText('N/A · Ignored · Precedence');
  expect(forbidden.getAttribute('title')).toContain('cannot render');
  fireEvent.click(forbidden);
  const notes = forbidden.parentElement!;
  expect(within(notes).getByText('A takes precedence.')).toBeTruthy();

  fireEvent.change(screen.getByLabelText('Group'), { target: { value: '' } });
  expect(screen.getAllByRole('table')).toHaveLength(1);
  expect(subjects()).toHaveLength(4);
  fireEvent.click(screen.getByText('Global values'));
  fireEvent.change(screen.getByLabelText('C'), { target: { value: '1' } });
  expect(subjects()).toHaveLength(3);

  fireEvent.click(screen.getByRole('button', { name: 'Reset matrix' }));
  expect(screen.getAllByRole('table')).toHaveLength(2);
  expect(subjects()).toHaveLength(7);
});

it('honors the 64-cell boundary including the theme multiplier, and handles a raw 65-cell route', () => {
  const definition = wide(8, 8);
  const { container, rerender } = render(
    <MatrixFixture definition={definition} initialMode="full" />,
  );
  expect(screen.getByText('64 combinations · 64 theme cells')).toBeTruthy();
  expect(container.querySelectorAll('.wb-matrix-combination')).toHaveLength(64);
  expect(container.querySelectorAll('[data-wb-subject]')).toHaveLength(63);
  expect(screen.getByText('N/A')).toBeTruthy();

  rerender(<MatrixFixture definition={definition} initialMode="full" themeCount={2} />);
  expect(screen.getByRole('button', { name: 'Full' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Full exceeds 64 cells/)).toBeTruthy();
  expect(container.querySelectorAll('.wb-matrix-combination')).toHaveLength(0);
  expect(container.querySelector('[data-wb-matrix-mode="slice"]')).toBeTruthy();

  cleanup();
  render(<MatrixFixture definition={wide(5, 13)} initialMode="full" raw />);
  expect(screen.getByText(/Full exceeds 64 cells/)).toBeTruthy();
  expect(screen.getAllByRole('table')).toHaveLength(1);
});

it('computes audit rows for the current overrides when a pending request is replaced', async () => {
  const { container } = render(<MatrixFixture initialMode="pairwise" />);
  expect(container.querySelector('[data-wb-pending]')).toBeTruthy();

  fireEvent.click(screen.getByText('Global values'));
  fireEvent.change(screen.getByLabelText('C'), { target: { value: '0' } });
  expect(await screen.findByText('4 / 4 compatible pairs · 4 combinations')).toBeTruthy();
  expect(container.querySelector('[data-wb-pending]')).toBeNull();
  expect(container.querySelectorAll('[data-wb-subject]')).toHaveLength(4);
  expect(screen.queryByText(/12 compatible pairs/)).toBeNull();
});

it('keeps slice focus and releases a named pin when it becomes a free axis', async () => {
  const definition = {
    ...grouped,
    constraints: [],
    states: [
      { id: 'all', title: 'All features', rows: 'a' },
      { id: 'pinned', title: 'Pinned feature', rows: 'a', fixed: { b: false } },
    ],
  };
  render(<MatrixFixture definition={definition} />);
  const picker = screen.getByLabelText('Slice');
  picker.focus();
  fireEvent.change(picker, { target: { value: 'pinned' } });
  expect(document.activeElement).toBe(picker);
  fireEvent.change(screen.getByLabelText('Group'), { target: { value: 'b' } });
  fireEvent.click(screen.getByRole('button', { name: 'Pairwise' }));
  expect(await screen.findByText(/12 \/ 12 compatible pairs/)).toBeTruthy();
});

it('renders each valid sample once while revealing a large slice and captures all rows', () => {
  const sample = vi.fn(() => <span data-wb-subject="" />);
  const definition = {
    ...wide(9, 2),
    render: sample,
    states: [{ id: 'all', title: 'All', rows: 'a', cols: 'b' }],
  };
  const { container } = render(<MatrixFixture definition={definition} />);
  const rows = () => container.querySelectorAll('tbody tr').length;
  expect(rows()).toBeLessThan(9);
  for (let step = 0; step < 9 && rows() < 9; step++) {
    const previous = rows();
    fireEvent.click(screen.getByRole('button', { name: /Show more rows/ }));
    expect(rows()).toBeGreaterThan(previous);
  }
  expect(rows()).toBe(9);
  expect(sample).toHaveBeenCalledTimes(17);
  cleanup();
  const capture = render(<MatrixFixture definition={definition} raw />);
  expect(capture.container.querySelectorAll('tbody tr')).toHaveLength(9);
});

it('resets slice StoryFrame controls when switching slices or clicking Reset matrix', () => {
  const definition = defineComponent({
    id: 'sliced',
    title: 'Sliced',
    category: 'Actions',
    status: 'Proto',
    props: {
      a: { ...fixture, label: 'A', kind: 'boolean', default: false },
    },
    states: [
      {
        id: 'first',
        title: 'First slice',
        rows: 'a',
        controls: {
          density: {
            kind: 'enum',
            label: 'Density',
            default: 'comfortable',
            choices: [
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ],
          },
        },
      },
      {
        id: 'second',
        title: 'Second slice',
        rows: 'a',
        controls: {
          pinned: { kind: 'boolean', label: 'Pinned', default: false },
        },
      },
    ],
    render: ({ values: { a }, ctx }) => (
      <span {...ctx.subject}>
        {String(a)}: {String(ctx.story?.controls.density ?? ctx.story?.controls.pinned)}
      </span>
    ),
  });

  const { container } = render(<MatrixFixture definition={definition} />);
  function expectCells(value: string): void {
    const cells = Array.from(
      container.querySelectorAll('[data-wb-subject]'),
      (node) => node.textContent,
    );
    expect(cells).toEqual([`false: ${value}`, `true: ${value}`]);
  }

  expectCells('comfortable');
  fireEvent.change(screen.getByRole('combobox', { name: 'Density' }), {
    target: { value: 'compact' },
  });
  expectCells('compact');

  // Clicking Reset matrix resets the slice StoryFrame controls via externalRevision.
  fireEvent.click(screen.getByRole('button', { name: 'Reset matrix' }));
  expectCells('comfortable');

  // Switching to a slice with a different controls schema remounts cleanly without leaking values.
  fireEvent.change(screen.getByRole('combobox', { name: 'Density' }), {
    target: { value: 'compact' },
  });
  fireEvent.change(screen.getByLabelText('Slice'), { target: { value: 'second' } });
  expectCells('false');
  expect(screen.queryByRole('combobox', { name: 'Density' })).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pinned' }));
  expectCells('true');

  // Returning to first slice starts from clean defaults.
  fireEvent.change(screen.getByLabelText('Slice'), { target: { value: 'first' } });
  expectCells('comfortable');
});

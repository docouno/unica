import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Inspector } from './Inspector.js';
import { readRoute } from './route.js';
import { defineComponent, defineScene } from './types.js';
import type { ComponentDefinition, WorkbenchConfig, WorkbenchTheme } from './types.js';

afterEach(cleanup);

const themes: readonly WorkbenchTheme[] = [
  {
    id: 'example-dark',
    family: 'example',
    familyLabel: 'Example',
    label: 'Example Dark',
    colorScheme: 'dark',
  },
  {
    id: 'example-light',
    family: 'example',
    familyLabel: 'Example',
    label: 'Example Light',
    colorScheme: 'light',
  },
];

const relatedScene = defineScene({
  id: 'schedule',
  title: 'Schedule',
  group: 'Scenes',
  uses: ['choice'],
  render: () => <p>Schedule scene</p>,
});

function renderArtboards(draw: (theme: WorkbenchTheme) => ReactNode): ReactElement {
  return (
    <div>
      {themes.map((theme) => (
        <section key={theme.id} aria-label={theme.label}>
          {draw(theme)}
        </section>
      ))}
    </div>
  );
}

function showInspector(
  component: ComponentDefinition,
  query = '',
  docsConfig?: WorkbenchConfig['docs'],
) {
  const navigateItem = vi.fn();
  const update = vi.fn();
  const config: WorkbenchConfig = {
    title: 'Test bench',
    themes,
    categories: ['Examples'],
    components: [component],
    scenes: [relatedScene],
    ...(docsConfig ? { docs: docsConfig } : {}),
  };
  render(
    <Inspector
      component={component}
      route={readRoute(query, config)}
      scenes={config.scenes}
      docsConfig={config.docs}
      themes={themes}
      update={update}
      itemHref={({ item, tab, slice, block, mode }) => {
        const params = new URLSearchParams({ item });
        if (tab) {
          params.set('tab', tab);
        }
        if (slice) {
          params.set('slice', slice);
        }
        if (block) {
          params.set('block', block);
        }
        if (mode) {
          params.set('mode', mode);
        }
        return `?${params.toString()}`;
      }}
      navigateItem={navigateItem}
      renderArtboards={renderArtboards}
    />,
  );
  return { navigateItem, update };
}

it.each([
  ['playground', 'subject'],
  ['states', 'subject'],
  ['states', 'case'],
  ['compositions', 'composition'],
] as const)('exposes the %s route to the %s preview', (tab, marker) => {
  showInspector(
    defineComponent({
      id: 'route',
      title: 'Route',
      category: 'Examples',
      status: 'UI',
      props: {},
      render: ({ ctx }) => <p>subject: {ctx.tab}</p>,
      states: [{ id: 'default', title: 'Default' }],
      cases: [
        {
          id: 'case',
          title: 'Case',
          kind: 'behavior',
          render: ({ ctx }) => <p>case: {ctx.tab}</p>,
        },
      ],
      compositions: [
        {
          id: 'composition',
          title: 'Composition',
          render: ({ ctx }) => <p>composition: {ctx.tab}</p>,
        },
      ],
    }),
    '?tab=' + tab,
  );
  expect(screen.getAllByText(marker + ': ' + tab)).toHaveLength(2);
});

it('shares valid controls across themes while keeping the last valid Subject and live JSX', async () => {
  const component = defineComponent({
    id: 'choice',
    title: 'Choice',
    category: 'Examples',
    status: 'Proto',
    props: {
      label: {
        kind: 'string',
        group: 'Content',
        description: 'Visible button label.',
        default: 'Submit choice',
      },
      ready: { kind: 'boolean', group: 'State', description: 'Marks when ready.', default: true },
      onPress: {
        kind: 'action',
        group: 'Events',
        description: 'Logs button press.',
        code: 'handlePress',
      },
    },
    constraints: [
      {
        kind: 'forbidden',
        when: { label: 'Reserved' },
        affects: ['label'],
        reason: 'This label is reserved.',
      },
    ],
    render: ({ values, ctx }) => (
      <button {...ctx.subject} type="button" onClick={() => ctx.action('onPress')(values.label)}>
        {values.label}
      </button>
    ),
  });
  showInspector(component);
  const controls = screen.getByRole('tab', { name: 'Controls' });
  expect(controls.getAttribute('aria-selected')).toBe('true');
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  const code = screen.getByRole('region', { name: 'JSX' });

  const label = screen.getByRole('textbox', { name: 'label' });
  fireEvent.change(label, { target: { value: 'Save choice' } });
  expect(screen.getAllByRole('button', { name: 'Save choice' })).toHaveLength(2);

  fireEvent.change(label, { target: { value: 'Reserved' } });
  expect(label.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('This label is reserved.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Save choice' })).toHaveLength(2);

  fireEvent.click(screen.getByRole('checkbox', { name: 'ready' }));
  fireEvent.change(label, { target: { value: 'Save choice' } });
  await waitFor(() => {
    expect(code.querySelector('.token.boolean')?.textContent).toBe('false');
    expect(code.textContent).toContain('ready={false}');
    expect(code.textContent).toContain('Save choice');
  });
  const light = screen.getByRole('region', { name: 'Example Light' });
  fireEvent.click(within(light).getByRole('button', { name: 'Save choice' }));
  controls.focus();
  fireEvent.keyDown(controls, { key: 'ArrowRight' });
  const events = screen.getByRole('tab', { name: 'Events' });
  expect(document.activeElement).toBe(events);
  expect(screen.getByRole('tabpanel', { name: 'Events' }).textContent).toContain(
    'Example Light onPressSave choice',
  );

  expect(screen.getByRole('region', { name: 'JSX' })).toBe(code);
  fireEvent.keyDown(events, { key: 'Home' });
  expect(document.activeElement).toBe(controls);
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'label' }).value).toBe(
    'Save choice',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reset props' }));
  expect(screen.getAllByRole('button', { name: 'Submit choice' })).toHaveLength(2);
});

it('preserves retained live event rows when the oldest entry expires', () => {
  showInspector(
    defineComponent({
      id: 'events',
      title: 'Events example',
      category: 'Examples',
      status: 'Proto',
      props: {
        change: {
          kind: 'action',
          group: 'Events',
          description: 'Reports a change.',
          code: 'onChange',
        },
      },
      render: ({ ctx }) => (
        <div {...ctx.subject}>
          <button
            type="button"
            onClick={() => {
              for (let i = 0; i < 100; i++) {
                ctx.action('change')(i);
              }
            }}
          >
            Fill log
          </button>
          <button type="button" onClick={() => ctx.action('change')(100)}>
            Append
          </button>
        </div>
      ),
    }),
  );
  const board = within(screen.getByRole('region', { name: 'Example Light' }));
  fireEvent.click(board.getByRole('button', { name: 'Fill log' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
  const panel = within(screen.getByRole('tabpanel', { name: 'Events' }));
  const before = panel.getAllByRole('listitem');
  fireEvent.click(board.getByRole('button', { name: 'Append' }));
  const after = panel.getAllByRole('listitem');
  expect(after).toHaveLength(100);
  expect(after.slice(0, -1).every((node, index) => node === before[index + 1])).toBe(true);
  expect(after[99]?.textContent).toContain('100');
  expect(panel.getByText('1 earlier event omitted.')).toBeTruthy();
  fireEvent.click(panel.getByRole('button', { name: 'Clear' }));
  expect(panel.getByText('No events yet.')).toBeTruthy();
});

function NativeForm({
  marker,
}: {
  readonly marker: { readonly 'data-wb-form': '' };
}): ReactElement {
  const [choice, setChoice] = useState('first');
  return (
    <form {...marker} onReset={() => setChoice('first')}>
      <label>
        <input
          type="radio"
          name="choice"
          value="first"
          checked={choice === 'first'}
          onChange={() => setChoice('first')}
        />{' '}
        First
      </label>
      <label>
        <input
          type="radio"
          name="choice"
          value="second"
          checked={choice === 'second'}
          onChange={() => setChoice('second')}
        />{' '}
        Second
      </label>
      <input readOnly name="tag" value="release" />
      <input readOnly name="tag" value="urgent" />
      <input disabled name="skipped" defaultValue="ignored" />
    </form>
  );
}

it('submits ordered native data and resets one owned form without touching another theme', () => {
  const component = defineComponent({
    id: 'choice',
    title: 'Choice',
    category: 'Examples',
    status: 'Proto',
    props: {},
    form: 'owned',
    render: ({ ctx }) => <NativeForm marker={ctx.form} />,
  });
  showInspector(component);
  const dark = within(screen.getByRole('region', { name: 'Example Dark' }));
  const light = within(screen.getByRole('region', { name: 'Example Light' }));
  fireEvent.click(dark.getByRole('radio', { name: 'Second' }));
  fireEvent.click(light.getByRole('radio', { name: 'Second' }));
  fireEvent.click(dark.getByRole('button', { name: 'Submit' }));

  fireEvent.click(screen.getByRole('tab', { name: 'FormData' }));
  const formData = screen.getByRole('tabpanel', { name: 'FormData' });
  expect([...formData.querySelectorAll('dt, dd')].map((entry) => entry.textContent)).toEqual([
    'choice',
    '"second"',
    'tag',
    '"release"',
    'tag',
    '"urgent"',
  ]);

  fireEvent.click(dark.getByRole('button', { name: 'Reset' }));
  expect(dark.getByRole<HTMLInputElement>('radio', { name: 'First' }).checked).toBe(true);
  expect(light.getByRole<HTMLInputElement>('radio', { name: 'Second' }).checked).toBe(true);
  fireEvent.click(dark.getByRole('button', { name: 'Submit' }));
  expect(formData.textContent).toContain('"first"');

  fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
  expect(
    within(screen.getByRole('tabpanel', { name: 'Events' }))
      .getAllByRole('listitem')
      .map((entry) => entry.textContent),
  ).toEqual(['Example Dark submit', 'Example Dark reset', 'Example Dark submit']);
});

it('inspects an inline form using only the actions supplied by the example', () => {
  showInspector(
    defineComponent({
      id: 'inline-form',
      title: 'Inline form',
      category: 'Examples',
      status: 'UI',
      props: {},
      form: 'inline',
      render: ({ ctx }) => (
        <form {...ctx.form}>
          <label>
            Name
            <input name="name" defaultValue="Draft" />
          </label>
          <button type="submit">Apply</button>
          <button type="reset">Restore</button>
        </form>
      ),
    }),
  );
  expect(screen.queryByRole('button', { name: /^Submit$/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Reset$/ })).toBeNull();

  const dark = within(screen.getByRole('region', { name: 'Example Dark' }));
  const name = dark.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
  fireEvent.change(name, { target: { value: 'Published' } });
  fireEvent.click(dark.getByRole('button', { name: 'Apply' }));
  fireEvent.click(dark.getByRole('button', { name: 'Restore' }));
  expect(name.value).toBe('Draft');

  fireEvent.click(screen.getByRole('tab', { name: 'FormData' }));
  expect(screen.getByRole('tabpanel', { name: 'FormData' }).textContent).toContain('"Published"');
  fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
  expect(
    within(screen.getByRole('tabpanel', { name: 'Events' }))
      .getAllByRole('listitem')
      .map((entry) => entry.textContent),
  ).toEqual(['Example Dark submit', 'Example Dark reset']);
});

it.each(['states', 'compositions'])(
  'keeps a marked native form on the %s route after submit',
  (tab) => {
    const component = defineComponent({
      id: 'choice',
      title: 'Choice',
      category: 'Examples',
      status: 'Proto',
      props: {},
      form: 'owned',
      states: [{ id: 'base', title: 'Base' }],
      compositions: [
        {
          id: 'form-example',
          title: 'Form example',
          render: ({ ctx }) => <NativeForm marker={ctx.form} />,
        },
      ],
      render: ({ ctx }) => <NativeForm marker={ctx.form} />,
    });
    showInspector(component, `?tab=${tab}`);
    const dark = within(screen.getByRole('region', { name: 'Example Dark' }));
    const form = dark.getByRole('radio', { name: 'First' }).closest('form');
    expect(form).toBeTruthy();
    expect(fireEvent.submit(form!)).toBe(false);
  },
);

it('shares example descriptions and highlighted JSX across theme previews in States and Compositions', async () => {
  const component = defineComponent({
    id: 'choice',
    title: 'Choice',
    category: 'Examples',
    status: 'Proto',
    props: {},
    cases: [
      {
        id: 'materials',
        title: 'Material comparison',
        kind: 'surface',
        compareSurfaces: true,
        caption: 'Inspect both surfaces.',
        render: ({ ctx }) => <span>{ctx.surface} sample</span>,
      },
      {
        id: 'live',
        title: 'Live example',
        kind: 'behavior',
        render: () => <button type="button">Open</button>,
      },
    ],
    compositions: [
      {
        id: 'settings',
        title: 'Settings',
        caption: 'Used in settings.',
        code: '<Settings><Choice enabled={false} label="<Delete />"/><Save /></Settings>',
        render: () => <p>Settings preview</p>,
      },
    ],
    render: () => <button type="button">Choice</button>,
  });
  showInspector(component, '?tab=states&block=materials&surface=overlay&raw=1');
  expect(screen.getAllByText('base sample')).toHaveLength(2);
  expect(screen.getAllByText('overlay sample')).toHaveLength(2);
  expect(screen.getAllByText('Inspect both surfaces.')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  cleanup();

  showInspector(component, '?tab=compositions');
  expect(screen.getAllByText('Used in settings.')).toHaveLength(1);
  expect(screen.getAllByText('Settings preview')).toHaveLength(2);
  await waitFor(() => {
    const snippets = document.querySelectorAll('.wb-inspector-code code');
    expect(snippets).toHaveLength(1);
    const snippet = snippets[0]!;
    expect(snippet.textContent).toContain('\n  <Choice enabled={false} label="<Delete />" />');
    expect(snippet.querySelector('.token.attr-name')?.textContent).toBe('enabled');
    expect(snippet.querySelector('.token.attr-value')?.textContent).toContain('<Delete />');
    expect(snippet.querySelector('delete')).toBeNull();
  });
});

it('assembles Quick Start, auto-generated Props & Constraints, Markdown docs and Consuming scenes on Usage', async () => {
  const component = defineComponent({
    id: 'choice',
    title: 'Choice & Action',
    summary: 'Compact choice control.',
    category: 'Examples',
    status: 'UI',
    props: {
      size: {
        kind: 'enum',
        group: 'Geometry',
        description: 'Visual size.',
        default: 'm',
        choices: [{ value: 's' }, { value: 'm' }],
      },
      previewOnly: {
        kind: 'boolean',
        group: 'Demo',
        demo: true,
        description: 'Only for Playground.',
        default: false,
      },
    },
    constraints: [
      {
        kind: 'ignored',
        when: { size: 's' },
        affects: ['previewOnly'],
        reason: 'Small choices ignore preview flags.',
      },
    ],
    code: () => '<Choice size="m">Pick</Choice>',
    render: () => <button type="button">Choice</button>,
  });

  const { navigateItem } = showInspector(component, '?tab=usage', {
    defaultImportFrom: '@example/ui',
    resolve: () => ({
      sourceLabel: 'docs/choice.md',
      markdown: () => Promise.resolve('## Guidance\n\nFollow [Schedule](schedule.md) for usage.'),
    }),
    resolveDocLink: (href) => (href === 'schedule.md' ? { item: 'schedule' } : undefined),
  });

  expect(screen.getByText('Compact choice control.')).toBeTruthy();
  expect(screen.getByText('docs/choice.md')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Quick start' })).toBeTruthy();
  await waitFor(() => {
    expect(document.querySelector('#wb-usage-quick-start pre')?.textContent).toContain(
      "import { Choice } from '@example/ui'",
    );
  });

  // Auto-generated props table excludes demo props from main table and lists constraints.
  const publicTable = screen.getByRole('table', { name: 'Public props' });
  expect(publicTable.textContent).toContain('size');
  expect(publicTable.textContent).not.toContain('previewOnly');
  expect(screen.getByText(/Small choices ignore preview flags\./)).toBeTruthy();
  expect(screen.getByText('Playground-only settings (1)')).toBeTruthy();

  // Async Markdown resolves and wires internal links + On this page TOC.
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Guidance' })).toBeTruthy();
  });
  expect(
    within(screen.getByRole('navigation', { name: 'On this page' })).getByRole('button', {
      name: 'Guidance',
    }),
  ).toBeTruthy();

  const scene = within(screen.getByRole('navigation', { name: 'Consuming scenes' })).getByRole(
    'link',
    { name: 'Schedule' },
  );
  expect(scene.getAttribute('href')).toBe('?item=schedule');
  fireEvent.click(scene);
  expect(navigateItem).toHaveBeenCalledWith({ item: 'schedule' });
});

it('formats slot props cleanly, filters Quick Start imports by exportedNames, and handles Markdown load failure', async () => {
  const component = defineComponent({
    id: 'badge-demo',
    title: 'BadgeDemo',
    category: 'Examples',
    status: 'UI',
    props: {
      icon: {
        kind: 'slot',
        group: 'Content',
        description: 'Optional leading icon.',
        default: 'none',
        choices: [{ value: 'none' }, { value: 'star', label: 'Star', code: '<StarIcon />' }],
      },
      padding: {
        kind: 'slot',
        group: 'Geometry',
        description: 'Padding at each breakpoint.',
        publicType: 'Responsive<Spacing>',
        default: 'compact',
        choices: [
          { value: 'compact', code: '8' },
          { value: 'responsive', code: '{ tablet: 16 }' },
        ],
      },
    },
    code: () =>
      'import React, { BadgeExtra as LocalExtra } from \'other\';\n<BadgeDemo icon={<HelperIcon />} label="<FakeTag />"><LocalExtra />New</BadgeDemo>',
    render: () => <span>New</span>,
  });

  showInspector(component, '?tab=usage', {
    defaultImportFrom: '@example/ui',
    exportedNames: new Set(['BadgeDemo', 'LocalExtra', 'FakeTag']),
    resolve: () => ({
      sourceLabel: 'docs/badge-demo.md',
      markdown: () => Promise.reject(new Error('network error')),
    }),
  });

  // Slot prop displays ReactNode and code snippet rather than Playground choice keys.
  const publicTable = screen.getByRole('table', { name: 'Public props' });
  expect(publicTable.textContent).toContain('ReactNode (e.g. <StarIcon />)');
  const padding = within(publicTable).getByRole('row', { name: /^padding/i });
  expect(within(padding).getByRole('cell', { name: 'Responsive<Spacing>' })).toBeTruthy();
  expect(within(padding).getByRole('cell', { name: '8' })).toBeTruthy();
  expect(publicTable.textContent).not.toContain('"none"');
  expect(publicTable.textContent).toContain('undefined');

  // Quick Start imports only exportedNames not already imported, ignores quoted tags, and emits no `;<` ASI guard.
  expect(screen.getByRole('button', { name: 'Copy quick start snippet' })).toBeTruthy();
  await waitFor(() => {
    const snippet = document.querySelector('#wb-usage-quick-start pre')?.textContent ?? '';
    expect(snippet).toContain("import { BadgeDemo } from '@example/ui'");
    expect(snippet).not.toMatch(/import\s+\{[^}]*(?:HelperIcon|LocalExtra|FakeTag)[^}]*\}/);
    expect(snippet).not.toContain(';<');
  });

  // Rejected async Markdown resolves cleanly without hanging on the loading indicator.
  await waitFor(() => {
    expect(screen.queryByText('Loading documentation…')).toBeNull();
  });
});

it('respects view.fixed over global filters, hides global filters without slices, and preserves mounted sections on jump/show-all', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = observe;
      disconnect = disconnect;
    },
  );

  const sliceOnly = defineComponent({
    id: 'fixed-slice',
    title: 'FixedSlice',
    category: 'Examples',
    status: 'Proto',
    props: {
      size: {
        kind: 'enum',
        group: 'Geometry',
        description: 'Scale.',
        default: 'm',
        choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
      },
      disabled: {
        kind: 'boolean',
        group: 'State',
        description: 'Disabled state.',
        default: false,
      },
    },
    states: [
      {
        id: 'pinned-size',
        title: 'Pinned size',
        rows: 'disabled',
        fixed: { size: 's' },
      },
      {
        id: 'free-size',
        title: 'Free size',
        rows: 'disabled',
      },
    ],
    cases: [
      {
        id: 'c1',
        title: 'Case 1',
        kind: 'behavior',
        controls: { flag: { kind: 'boolean', label: 'Flag', default: false } },
        render: ({ ctx }) => <span>c1:{String(ctx.story?.controls.flag)}</span>,
      },
      { id: 'c2', title: 'Case 2', kind: 'behavior', render: () => <span>Body 2</span> },
      { id: 'c3', title: 'Case 3', kind: 'behavior', render: () => <span>Body 3</span> },
    ],
    render: ({ values }) => (
      <span>
        size={String(values.size)}|disabled={String(values.disabled)}
      </span>
    ),
  });

  try {
    showInspector(sliceOnly, '?tab=states');
    const pinnedFrame = document.querySelector<HTMLElement>(
      '.wb-story-frame[data-wb-slice="pinned-size"]',
    )!;
    const freeFrame = document.querySelector<HTMLElement>(
      '.wb-story-frame[data-wb-slice="free-size"]',
    )!;
    expect(within(freeFrame).getAllByText('size=m|disabled=false')).toHaveLength(2);
    // Global filter applies non-default 'l' (option index '2') to free-size while pinned-size keeps view.fixed ('s').
    fireEvent.change(screen.getByLabelText('size'), { target: { value: '2' } });
    expect(screen.getByText('Global filters (1)')).toBeTruthy();
    expect(within(pinnedFrame).getAllByText('size=s|disabled=false')).toHaveLength(2);
    expect(within(pinnedFrame).queryByText('size=l|disabled=false')).toBeNull();
    expect(within(freeFrame).getAllByText('size=l|disabled=false')).toHaveLength(2);
    expect(within(freeFrame).queryByText('size=m|disabled=false')).toBeNull();

    // Mutate mounted Case 1 frame control, then click TOC for lazy Case 3 (index 4 >= eager 3).
    fireEvent.click(screen.getByRole('checkbox', { name: 'Flag' }));
    expect(screen.getAllByText('c1:true')).toHaveLength(2);
    expect(screen.queryByText('Body 3')).toBeNull();

    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'State sections' })).getByRole('button', {
        name: /Case 3/,
      }),
    );
    expect(screen.getAllByText('Body 3')).toHaveLength(2);
    // Live Case 1 StoryFrame stayed mounted and kept its state!
    expect(screen.getAllByText('c1:true')).toHaveLength(2);

    // Slice-less component hides Global filters, mounts lazy sections on demand, and keeps
    // filtered StoryFrames mounted when clearing a single-section filter.
    cleanup();
    const casesOnly = defineComponent({
      id: 'cases-only',
      title: 'CasesOnly',
      category: 'Examples',
      status: 'Proto',
      props: {
        tone: {
          kind: 'enum',
          group: 'Role',
          description: 'Tone.',
          default: 'neutral',
          choices: [{ value: 'neutral' }, { value: 'accent' }],
        },
      },
      cases: [
        { id: 'only-1', title: 'Only 1', kind: 'behavior', render: () => <span>Body 1</span> },
        { id: 'only-2', title: 'Only 2', kind: 'behavior', render: () => <span>Body 2</span> },
        { id: 'only-3', title: 'Only 3', kind: 'behavior', render: () => <span>Body 3</span> },
        { id: 'only-4', title: 'Only 4', kind: 'behavior', render: () => <span>Body 4</span> },
      ],
      render: () => <span>Subject</span>,
    });
    showInspector(casesOnly, '?tab=states');
    expect(screen.queryByText('Global filters')).toBeNull();
    expect(screen.queryByText('Body 4')).toBeNull();
    const firstFrame = document.querySelector('.wb-story-frame[data-wb-block="only-1"]');
    fireEvent.click(screen.getByRole('button', { name: 'Load Only 4 preview' }));
    expect(screen.getAllByText('Body 4')).toHaveLength(2);
    expect(document.querySelector('.wb-story-frame[data-wb-block="only-1"]')).toBe(firstFrame);

    cleanup();
    const casesConfig: WorkbenchConfig = {
      title: 'Test bench',
      themes,
      categories: ['Examples'],
      components: [casesOnly],
      scenes: [],
    };
    const filteredRender = render(
      <Inspector
        component={casesOnly}
        route={readRoute('?tab=states&block=only-4', casesConfig)}
        scenes={[]}
        themes={themes}
        update={() => {}}
        itemHref={({ item }) => `?item=${item}`}
        navigateItem={() => {}}
        renderArtboards={renderArtboards}
      />,
    );
    const fourthFrame = document.querySelector('.wb-story-frame[data-wb-block="only-4"]');
    expect(fourthFrame).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show all sections' })).toBeTruthy();
    // Clearing block to show all sections preserves the mounted Only 4 StoryFrame instance.
    filteredRender.rerender(
      <Inspector
        component={casesOnly}
        route={readRoute('?tab=states', casesConfig)}
        scenes={[]}
        themes={themes}
        update={() => {}}
        itemHref={({ item }) => `?item=${item}`}
        navigateItem={() => {}}
        renderArtboards={renderArtboards}
      />,
    );
    expect(document.querySelector('.wb-story-frame[data-wb-block="only-4"]')).toBe(fourthFrame);
    expect(screen.getAllByText('Body 4')).toHaveLength(2);
  } finally {
    vi.unstubAllGlobals();
  }
});

it('renders States overview lazily until scrolled or frozen and switches to Combinator', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let observerCallback: ((entries: readonly { isIntersecting: boolean }[]) => void) | undefined;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: readonly { isIntersecting: boolean }[]) => void) {
        observerCallback = cb;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );

  const component = defineComponent({
    id: 'many',
    title: 'Many',
    category: 'Examples',
    status: 'Proto',
    props: {
      size: {
        kind: 'enum',
        group: 'Geometry',
        description: 'Scale.',
        default: 'm',
        choices: [{ value: 's' }, { value: 'm' }],
      },
    },
    states: [{ id: 'scale', title: 'Scale', rows: 'size' }],
    cases: [
      { id: 'c1', title: 'Case 1', kind: 'behavior', render: () => <span>Body 1</span> },
      { id: 'c2', title: 'Case 2', kind: 'behavior', render: () => <span>Body 2</span> },
      { id: 'c3', title: 'Case 3', kind: 'behavior', render: () => <span>Body 3</span> },
    ],
    render: ({ values }) => <span>Size {values.size}</span>,
  });

  try {
    const { update } = showInspector(component, '?tab=states');
    // Top 3 sections (scale, c1, c2) mount eagerly; 4th section (c3) waits for intersection.
    expect(screen.getAllByText('Body 1')).toHaveLength(2);
    expect(screen.getAllByText('Body 2')).toHaveLength(2);
    expect(screen.queryByText('Body 3')).toBeNull();
    expect(observe).toHaveBeenCalledTimes(1);

    act(() => {
      observerCallback?.([{ isIntersecting: true }]);
    });
    expect(screen.getAllByText('Body 3')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Combinator' }));
    expect(update).toHaveBeenCalledWith({ mode: 'slice', block: undefined }, 'replace');

    cleanup();
    // Under freeze=1, every section mounts eagerly without waiting for IntersectionObserver.
    showInspector(component, '?tab=states&freeze=1');
    expect(screen.getAllByText('Body 3')).toHaveLength(2);
  } finally {
    vi.unstubAllGlobals();
  }
});

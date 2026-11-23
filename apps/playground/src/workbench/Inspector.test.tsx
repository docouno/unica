import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

function showInspector(component: ComponentDefinition, query = '') {
  const navigateItem = vi.fn();
  const update = vi.fn();
  const config: WorkbenchConfig = {
    title: 'Test bench',
    themes,
    categories: ['Examples'],
    components: [component],
    scenes: [relatedScene],
  };
  render(
    <Inspector
      component={component}
      route={readRoute(query, config)}
      scenes={config.scenes}
      themes={themes}
      update={update}
      itemHref={(id) => `?item=${id}`}
      navigateItem={navigateItem}
      renderArtboards={renderArtboards}
    />,
  );
  return { navigateItem, update };
}

it.each([
  ['playground', 'subject'],
  ['matrix', 'reference'],
  ['cases', 'case'],
  ['usage', 'usage'],
] as const)('exposes the %s route to authored previews', (tab, marker) => {
  showInspector(
    defineComponent({
      id: 'route',
      title: 'Route',
      category: 'Examples',
      status: 'UI',
      props: {},
      render: ({ ctx }) => <p>subject: {ctx.tab}</p>,
      matrixViews: [
        {
          id: 'default',
          title: 'Default',
          reference: ({ ctx }) => <p>reference: {ctx.tab}</p>,
        },
      ],
      cases: [
        {
          id: 'case',
          title: 'Case',
          kind: 'behavior',
          render: ({ ctx }) => <p>case: {ctx.tab}</p>,
        },
      ],
      usage: [{ id: 'usage', title: 'Usage', render: ({ ctx }) => <p>usage: {ctx.tab}</p> }],
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

it.each(['matrix', 'usage'])('keeps a marked native form on the %s route after submit', (tab) => {
  const component = defineComponent({
    id: 'choice',
    title: 'Choice',
    category: 'Examples',
    status: 'Proto',
    props: {},
    form: 'owned',
    render: ({ ctx }) => <NativeForm marker={ctx.form} />,
  });
  showInspector(component, `?tab=${tab}`);
  const dark = within(screen.getByRole('region', { name: 'Example Dark' }));
  const form = dark.getByRole('radio', { name: 'First' }).closest('form');
  expect(form).toBeTruthy();
  expect(fireEvent.submit(form!)).toBe(false);
});

it('shares example descriptions and highlighted JSX across theme previews', async () => {
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
    usage: [
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
  showInspector(component, '?tab=cases&block=materials&surface=overlay&raw=1');
  expect(screen.getAllByText('base sample')).toHaveLength(2);
  expect(screen.getAllByText('overlay sample')).toHaveLength(2);
  expect(screen.getAllByText('Inspect both surfaces.')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  cleanup();

  const { navigateItem } = showInspector(component, '?tab=usage');
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
  const scene = screen.getByRole('link', { name: 'Schedule' });
  expect(scene.getAttribute('href')).toBe('?item=schedule');
  fireEvent.click(scene);
  expect(navigateItem).toHaveBeenCalledWith('schedule');
});

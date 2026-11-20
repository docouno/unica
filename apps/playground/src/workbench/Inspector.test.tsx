import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

it('shares valid controls across themes while keeping the last valid Subject and live JSX', () => {
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
  const label = screen.getByRole('textbox', { name: 'label' });
  fireEvent.change(label, { target: { value: 'Save choice' } });
  expect(screen.getAllByRole('button', { name: 'Save choice' })).toHaveLength(2);

  fireEvent.change(label, { target: { value: 'Reserved' } });
  expect(label.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('This label is reserved.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Save choice' })).toHaveLength(2);

  fireEvent.click(screen.getByRole('checkbox', { name: 'ready' }));
  fireEvent.change(label, { target: { value: 'Save choice' } });
  expect(screen.getByRole('region', { name: 'JSX' }).textContent).toContain('ready={false}');
  const light = screen.getByRole('region', { name: 'Example Light' });
  fireEvent.click(within(light).getByRole('button', { name: 'Save choice' }));
  expect(screen.getByRole('region', { name: 'Events' }).textContent).toContain(
    'Example Light onPressSave choice',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Reset props' }));
  expect(screen.getAllByRole('button', { name: 'Submit choice' })).toHaveLength(2);
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

  const formData = screen.getByRole('region', { name: 'FormData' });
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

  expect(
    within(screen.getByRole('region', { name: 'Events' }))
      .getAllByRole('listitem')
      .map((entry) => entry.textContent),
  ).toEqual(['Example Dark submit', 'Example Dark reset', 'Example Dark submit']);
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

it('keeps both declared case surfaces and links to the registered scene from Usage', () => {
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
    render: () => <button type="button">Choice</button>,
  });
  showInspector(component, '?tab=cases&block=materials&surface=overlay&raw=1');
  expect(screen.getAllByText('base sample')).toHaveLength(2);
  expect(screen.getAllByText('overlay sample')).toHaveLength(2);
  expect(screen.getAllByText('Inspect both surfaces.')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  cleanup();

  const { navigateItem } = showInspector(component, '?tab=usage');
  const scene = screen.getByRole('link', { name: 'Schedule' });
  expect(scene.getAttribute('href')).toBe('?item=schedule');
  fireEvent.click(scene);
  expect(navigateItem).toHaveBeenCalledWith('schedule');
});

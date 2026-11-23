import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { StoryFrame } from './StoryFrame.js';
import { useStoryAction } from './storyFrameState.js';
import { componentCode, defaultValues, validateComponent } from './schema.js';
import { defineComponent } from './types.js';
import type { PreviewContext, StoryContext } from './types.js';

afterEach(cleanup);

function ArtboardProbe({
  label,
  story,
}: {
  readonly label: string;
  readonly story: StoryContext;
}): ReactElement {
  const [count, setCount] = useState(0);
  const [events, setEvents] = useState<string[]>([]);

  useStoryAction({ story }, (actionId) => {
    setEvents((previous) => [...previous, actionId]);
    if (actionId === 'bump') {
      setCount((previous) => previous + 1);
    }
  });

  return (
    <section aria-label={label}>
      <p data-testid="state">
        mode={String(story.controls.mode)}|busy={String(story.controls.busy)}|step=
        {String(story.controls.step)}|count={String(count)}|rev={String(story.revision)}|last=
        {story.lastAction ? `${story.lastAction.id}:${String(story.lastAction.seq)}` : 'none'}
      </p>
      <p data-testid="events">{events.join(',') || 'empty'}</p>
      <input aria-label="Local draft" defaultValue="Initial" />
    </section>
  );
}

it('synchronizes enum, boolean, number controls, actions and reset across all artboards', () => {
  render(
    <StoryFrame
      title="Sync study"
      caption="Controls stay synchronized across every artboard."
      controls={{
        mode: {
          kind: 'enum',
          label: 'Mode',
          default: 'idle',
          choices: [
            { value: 'idle', label: 'Idle' },
            { value: 'error', label: 'Error' },
          ],
        },
        busy: { kind: 'boolean', label: 'Busy', default: false },
        step: { kind: 'number', label: 'Step', default: 2, min: 1, max: 5 },
      }}
      actions={[{ id: 'bump', label: 'Bump all' }]}
      reset
    >
      {(story) => (
        <>
          <ArtboardProbe label="Theme A" story={story} />
          <ArtboardProbe label="Theme B" story={story} />
        </>
      )}
    </StoryFrame>,
  );

  const a = within(screen.getByRole('region', { name: 'Theme A' }));
  const b = within(screen.getByRole('region', { name: 'Theme B' }));
  const toolbar = within(screen.getByRole('group', { name: 'Sync study controls' }));

  expect(a.getByTestId('state').textContent).toBe(
    'mode=idle|busy=false|step=2|count=0|rev=0|last=none',
  );
  expect(b.getByTestId('state').textContent).toBe(
    'mode=idle|busy=false|step=2|count=0|rev=0|last=none',
  );

  fireEvent.change(toolbar.getByRole('combobox', { name: 'Mode' }), { target: { value: 'error' } });
  fireEvent.click(toolbar.getByRole('checkbox', { name: 'Busy' }));
  const stepInput = toolbar.getByRole<HTMLInputElement>('spinbutton', { name: 'Step' });
  fireEvent.change(stepInput, { target: { value: '' } });
  expect(stepInput.getAttribute('aria-invalid')).toBe('true');
  fireEvent.change(stepInput, { target: { value: '9' } });
  expect(stepInput.getAttribute('aria-invalid')).toBe('true');
  fireEvent.blur(stepInput);
  expect(stepInput.value).toBe('5');
  expect(stepInput.getAttribute('aria-invalid')).toBeNull();
  fireEvent.click(toolbar.getByRole('button', { name: 'Bump all' }));
  fireEvent.change(a.getByLabelText<HTMLInputElement>('Local draft'), {
    target: { value: 'Edited' },
  });

  for (const board of [a, b]) {
    expect(board.getByTestId('state').textContent).toBe(
      'mode=error|busy=true|step=5|count=1|rev=0|last=bump:1',
    );
    expect(board.getByTestId('events').textContent).toBe('bump');
  }

  const regionBeforeReset = screen.getByRole('region', { name: 'Theme A' });
  const reset = toolbar.getByRole('button', { name: 'Reset' });
  reset.focus();
  fireEvent.click(reset);

  expect(document.activeElement).toBe(reset);
  const freshA = screen.getByRole('region', { name: 'Theme A' });
  const freshB = screen.getByRole('region', { name: 'Theme B' });
  expect(freshA).not.toBe(regionBeforeReset);
  expect(within(freshA).getByLabelText<HTMLInputElement>('Local draft').value).toBe('Initial');
  for (const board of [within(freshA), within(freshB)]) {
    expect(board.getByTestId('state').textContent).toBe(
      'mode=idle|busy=false|step=2|count=0|rev=1|last=none',
    );
    expect(board.getByTestId('events').textContent).toBe('empty');
  }
});

it('resets frame controls when externalRevision advances, preserves state across identical inline controls, and hides toolbar in raw mode', () => {
  const stableControls = { active: { kind: 'boolean', label: 'Active', default: false } } as const;
  const { rerender } = render(
    <StoryFrame title="External sync" controls={stableControls} externalRevision={0}>
      {(story) => <p data-testid="flag">{String(story.controls.active)}</p>}
    </StoryFrame>,
  );

  fireEvent.click(screen.getByRole('checkbox', { name: 'Active' }));
  expect(screen.getByTestId('flag').textContent).toBe('true');

  // Re-rendering with a fresh object literal of the same schema preserves live control state.
  rerender(
    <StoryFrame
      title="External sync"
      controls={{ active: { kind: 'boolean', label: 'Active', default: false } }}
      externalRevision={0}
    >
      {(story) => <p data-testid="flag">{String(story.controls.active)}</p>}
    </StoryFrame>,
  );
  expect(screen.getByTestId('flag').textContent).toBe('true');

  rerender(
    <StoryFrame title="External sync" controls={stableControls} externalRevision={1}>
      {(story) => <p data-testid="flag">{String(story.controls.active)}</p>}
    </StoryFrame>,
  );
  expect(screen.getByTestId('flag').textContent).toBe('false');

  rerender(
    <StoryFrame
      title="External sync"
      caption="Still visible in raw capture."
      controls={stableControls}
      actions={[{ id: 'go', label: 'Run' }]}
      reset
      raw
    >
      {(story) => <p data-testid="flag">{String(story.controls.active)}</p>}
    </StoryFrame>,
  );
  expect(screen.getByRole('heading', { name: 'External sync' })).toBeTruthy();
  expect(screen.getByText('Still visible in raw capture.')).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'External sync controls' })).toBeNull();
});

it('supports the declarative component shortcut with auto-rendered subjects and idiomatic JSX', () => {
  function Pill({
    tone = 'neutral',
    leading,
    onPress,
    children,
    ...rest
  }: {
    readonly tone?: 'neutral' | 'accent';
    readonly leading?: ReactElement;
    readonly onPress?: (tone: string) => void;
    readonly children?: string;
  }): ReactElement {
    return (
      <button type="button" data-tone={tone} onClick={() => onPress?.(tone)} {...rest}>
        {leading}
        {children}
      </button>
    );
  }

  const specimen = defineComponent({
    id: 'pill',
    title: 'Pill',
    category: 'Actions',
    status: 'UI',
    component: Pill,
    slotRenderers: {
      leading: {
        none: undefined,
        dot: <span data-testid="dot">•</span>,
      },
    },
    props: {
      tone: {
        kind: 'enum',
        group: 'Role',
        description: 'Visual emphasis.',
        default: 'neutral',
        choices: [{ value: 'neutral' }, { value: 'accent' }],
      },
      leading: {
        kind: 'slot',
        group: 'Content',
        description: 'Optional leading decoration.',
        default: 'none',
        choices: [{ value: 'none' }, { value: 'dot', code: '<Dot />' }],
      },
      children: {
        kind: 'string',
        group: 'Content',
        description: 'Visible label.',
        default: 'Ready',
      },
      onPress: {
        kind: 'action',
        group: 'Events',
        description: 'Fires on click.',
        code: 'handlePress',
      },
    },
  });

  expect(() => validateComponent(specimen)).not.toThrow();
  expect(specimen.componentName).toBe('Pill');

  const defaults = defaultValues(specimen.props);
  expect(componentCode(specimen, defaults)).toBe('<Pill onPress={handlePress}>Ready</Pill>');
  expect(
    componentCode(specimen, { ...defaults, tone: 'accent', leading: 'dot', children: 'Publish' }),
  ).toBe('<Pill tone="accent" leading={<Dot />} onPress={handlePress}>Publish</Pill>');

  const onPress = vi.fn();
  const Subject = specimen.render;
  const ctx: PreviewContext = {
    id: 'pill-test',
    tab: 'playground',
    theme: { id: 'dark', label: 'Dark', family: 'base', familyLabel: 'Base', colorScheme: 'dark' },
    surface: 'base',
    comparing: false,
    subject: { 'data-wb-subject': '' },
    form: { 'data-wb-form': '' },
    action: () => onPress,
  };

  render(
    <Subject
      ctx={ctx}
      values={{ ...defaults, tone: 'accent', leading: 'dot', children: 'Publish' }}
    />,
  );
  const button = screen.getByRole('button', { name: /Publish/ });
  expect(button.hasAttribute('data-wb-subject')).toBe(true);
  expect(button.getAttribute('data-tone')).toBe('accent');
  expect(screen.getByTestId('dot')).toBeTruthy();
  fireEvent.click(button);
  expect(onPress).toHaveBeenCalledWith('accent');
});

it('prefers PascalCase title over minified function names and supports defaultProps with slot children', () => {
  function Hr({
    fixedRole,
    children,
    ...rest
  }: {
    readonly fixedRole?: string;
    readonly children?: ReactElement;
  }): ReactElement {
    return (
      <div data-role={fixedRole} {...rest}>
        {children}
      </div>
    );
  }

  const specimen = defineComponent({
    id: 'status-badge',
    title: 'StatusBadge',
    category: 'Feedback',
    status: 'UI',
    component: Hr,
    defaultChildren: 'Fallback',
    defaultProps: { fixedRole: 'status', children: 'IgnoredDefaultProp' },
    slotRenderers: {
      children: {
        empty: undefined,
        dot: <span data-testid="slot-child">Live</span>,
      },
    },
    props: {
      children: {
        kind: 'slot',
        group: 'Content',
        description: 'Slot body.',
        default: 'dot',
        choices: [{ value: 'empty' }, { value: 'dot', code: '<Dot />' }],
      },
    },
  });

  expect(specimen.componentName).toBe('StatusBadge');
  const defaults = defaultValues(specimen.props);
  expect(componentCode(specimen, defaults)).toBe(
    '<StatusBadge fixedRole="status"><Dot /></StatusBadge>',
  );
  expect(componentCode(specimen, { children: 'empty' })).toBe('<StatusBadge fixedRole="status" />');

  const Subject = specimen.render;
  const ctx: PreviewContext = {
    id: 'badge-test',
    tab: 'playground',
    theme: { id: 'dark', label: 'Dark', family: 'base', familyLabel: 'Base', colorScheme: 'dark' },
    surface: 'base',
    comparing: false,
    subject: { 'data-wb-subject': '' },
    form: { 'data-wb-form': '' },
    action: () => () => {},
  };

  const { container } = render(<Subject ctx={ctx} values={defaults} />);
  expect(container.querySelector('[data-wb-subject]')?.getAttribute('data-role')).toBe('status');
  expect(screen.getByTestId('slot-child').textContent).toBe('Live');
});

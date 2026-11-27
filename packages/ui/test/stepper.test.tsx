import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Stepper, StepperStep } from '../src/index.js';
import type { StepperProps } from '../src/index.js';

afterEach(cleanup);

type PositionProps = Partial<
  Pick<StepperProps, 'value' | 'defaultValue' | 'allowReturn' | 'onValueChange'>
>;

function MapOfStages(props: PositionProps): ReactElement {
  return (
    <Stepper aria-label="Setup" layout="vertical" {...props}>
      <StepperStep id="source" value="source" label="Source" completed />
      <StepperStep id="verify" value="verify" label="Verify" description="Check the files." />
      <StepperStep id="commit" value="commit" label="Commit" completed status="danger" />
      <StepperStep id="finish" value="finish" label="Finish" />
    </Stepper>
  );
}

function items(): HTMLElement[] {
  return within(screen.getByRole('list')).getAllByRole('listitem');
}

function currentItem(): HTMLElement | undefined {
  return items().find((row) => row.getAttribute('aria-current') === 'step');
}

function sourceAction(): HTMLElement {
  return within(items()[0]!).getByRole('button', { name: 'Step 1: Source, completed' });
}

it('keeps completion and correction facts independent of a controlled position', () => {
  const onValueChange = vi.fn();
  const { rerender } = render(
    <MapOfStages value="verify" defaultValue="source" allowReturn onValueChange={onValueChange} />,
  );
  expect(currentItem()?.id).toBe('verify');
  expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(2);
  const commit = within(items()[2]!).getByRole('button', { name: 'Step 3: Commit' });
  expect(document.getElementById(commit.getAttribute('aria-describedby')!)?.textContent).toBe(
    'Needs attention',
  );
  fireEvent.click(sourceAction());
  fireEvent.click(sourceAction());
  expect(onValueChange.mock.calls).toEqual([['source'], ['source']]);
  expect(currentItem()?.id).toBe('verify');
  rerender(<MapOfStages value="source" allowReturn onValueChange={onValueChange} />);
  expect(currentItem()?.id).toBe('source');
  expect(within(items()[0]!).queryByRole('button')).toBeNull();
  expect(items()[0]?.querySelector('.unica-visually-hidden')?.textContent).toBe(
    'Step 1: Source, completed',
  );
  expect(onValueChange).toHaveBeenCalledTimes(2);
});

it('accepts local actions and preserves local position when the default changes', () => {
  const onValueChange = vi.fn();
  const { rerender } = render(
    <MapOfStages defaultValue="verify" allowReturn onValueChange={onValueChange} />,
  );
  fireEvent.click(sourceAction());
  expect(currentItem()?.id).toBe('source');
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith('source');
  rerender(<MapOfStages defaultValue="finish" allowReturn onValueChange={onValueChange} />);
  expect(currentItem()?.id).toBe('source');
  fireEvent.click(within(items()[2]!).getByRole('button'));
  expect(currentItem()?.id).toBe('commit');
  expect(within(items()[2]!).getByText('Needs attention')).toBeTruthy();
  expect(onValueChange.mock.calls).toEqual([['source'], ['commit']]);
});

it('renders passive with a subscriber or a controlled owner without a handler', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { rerender } = render(<MapOfStages value="verify" onValueChange={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<MapOfStages value="verify" allowReturn />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('requires onValueChange'));
  } finally {
    warn.mockRestore();
  }
});

it('keeps the first valid declaration in source order, preserves refs and never selects implicitly', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = createRef<HTMLDivElement>();
  const item = createRef<HTMLLIElement>();
  const onValueChange = vi.fn();

  function stages(order: readonly string[]): ReactElement {
    return (
      <>
        <h2 id="setup-heading">Finish setup</h2>
        <Stepper
          aria-label="Fallback"
          aria-labelledby="setup-heading"
          data-project="sample"
          defaultValue="B"
          onValueChange={onValueChange}
          ref={root}
        >
          {false}
          <>
            {order.map((value) => (
              <StepperStep
                key={value}
                value={value}
                label={value}
                ref={value === 'B' ? item : undefined}
              />
            ))}
            <span>Not a step</span>
          </>
          <StepperStep value=" " label="Invalid key" />
          <StepperStep value="A" label="Duplicate A" />
        </Stepper>
      </>
    );
  }

  try {
    const { rerender } = render(stages(['A', 'B']));
    const b = item.current;
    expect(root.current).toBe(screen.getByRole('group', { name: 'Finish setup' }));
    expect(root.current?.getAttribute('data-project')).toBe('sample');
    expect(items()).toHaveLength(2);
    expect(currentItem()).toBe(b);
    rerender(stages(['B', 'A']));
    expect(items()[0]).toBe(b);
    rerender(stages(['A']));
    expect(currentItem()).toBeUndefined();
    expect(item.current).toBeNull();
    expect(screen.queryByText('Duplicate A')).toBeNull();
    rerender(stages(['A', 'B']));
    expect(currentItem()).toBe(item.current);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(3);
  } finally {
    warn.mockRestore();
  }
});

it('uses the corrected completion fact for counts, labels and traversed connectors', () => {
  function map(danger: boolean): ReactElement {
    return (
      <Stepper aria-label="Import" value={null} layout="compact">
        <StepperStep
          value="source"
          label="Source"
          completed
          status={danger ? 'danger' : 'neutral'}
        />
        <StepperStep value="target" label="Destination" completed message="Ignored when neutral" />
      </Stepper>
    );
  }
  const { container, rerender } = render(map(true));
  expect(screen.getByText('1 of 2 steps complete')).toBeTruthy();
  expect(container.querySelector('.unica-stepper-summary-issue')?.textContent).toBe('Check Source');
  expect(screen.queryByText('Ignored when neutral')).toBeNull();
  expect(container.querySelector('[data-unica-stepper-traversed]')).toBeNull();
  rerender(map(false));
  expect(screen.getByText('All steps complete')).toBeTruthy();
  expect(container.querySelector('.unica-visually-hidden')?.textContent).toBe(
    'Step 1: Source, completed',
  );
  expect(container.querySelectorAll('[data-unica-stepper-traversed]')).toHaveLength(1);
});

it('renders no map for empty steps or standalone declarations and no rail for a single step', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { container, rerender } = render(
      <>
        <StepperStep value="a" label="Standalone" />
        <Stepper aria-label="Empty">{false}</Stepper>
      </>,
    );
    expect(container.childElementCount).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('directly inside a Stepper'));
    rerender(
      <Stepper aria-label="Single" value="unknown">
        <StepperStep value="a" label="Only" />
      </Stepper>,
    );
    expect(items()).toHaveLength(1);
    expect(currentItem()).toBeUndefined();
    expect(container.querySelector('.unica-stepper-connector')).toBeNull();
  } finally {
    warn.mockRestore();
  }
});

it('renders authored facts and deterministic localized markers on the server', () => {
  const html = renderToString(
    <Stepper
      aria-label="Import"
      value="b"
      dir="rtl"
      layout="compact"
      messages={{
        markerNumber: (index) => ['١', '٢'][index - 1]!,
        position: (index, total) => `${total} / ${index}`,
      }}
    >
      <StepperStep value="a" label="Source" completed />
      <StepperStep value="b" label="Verify" description="Check the files." dir="ltr" lang="en" />
    </Stepper>,
  );
  expect(html).toContain('role="group" aria-label="Import"');
  expect(html).toContain('>٢</bdi>');
  expect(html).toContain('<bdi lang="en" dir="ltr">Verify</bdi>');
  expect(html).toContain('2 / 2');
  const markup = new DOMParser().parseFromString(html, 'text/html');
  expect(markup.querySelector('li .unica-visually-hidden')?.textContent).toBe(
    'Step 1: Source, completed',
  );
});

it('preserves the author language and direction on every marked insertion in a custom phrase', () => {
  const { container } = render(
    <Stepper
      aria-label="Import"
      value="verify"
      lang="en"
      layout="compact"
      messages={{
        checkStep: (label) => `Review \u2068${label}\u2069 or send \u2068${label}\u2069`,
      }}
    >
      <StepperStep value="verify" label="Verify" />
      <StepperStep value="commit" label="ܐ 123 ܒ!" lang="syr" dir="rtl" status="danger" />
    </Stepper>,
  );
  const summary = container.querySelector('.unica-stepper-summary-issue');
  expect(summary?.textContent).toBe('Review ܐ 123 ܒ! or send ܐ 123 ܒ!');
  expect(
    [...(summary?.querySelectorAll('bdi[lang="syr"][dir="rtl"]') ?? [])].map(
      (part) => part.textContent,
    ),
  ).toEqual(['ܐ 123 ܒ!', 'ܐ 123 ܒ!']);
});

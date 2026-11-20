import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { startTransition, Suspense, use, useLayoutEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useControllableState } from '../src/core/useControllableState.js';
import type { ControllableStateOptions } from '../src/core/useControllableState.js';
import { useIsoLayoutEffect } from '../src/core/useIsoLayoutEffect.js';

afterEach(cleanup);

it('delivers controlled proposals in a batch, including a return to the current prop', () => {
  const changed = vi.fn<(value: string) => void>();
  const { result } = renderHook(() => {
    const [value, setValue] = useState('A');
    return useControllableState({
      value,
      defaultValue: 'default',
      onChange(next) {
        changed(next);
        setValue(next);
      },
    });
  });

  act(() => {
    result.current[1]('B');
    result.current[1]('A');
  });
  expect(changed.mock.calls).toEqual([['B'], ['A']]);
  expect(result.current[0]).toBe('A');
});

it('repeats a rejected proposal and renders only the controlled prop', () => {
  const changed = vi.fn<(value: string) => void>();
  const { result, rerender } = renderHook(
    (value) => useControllableState({ value, defaultValue: 'default', onChange: changed }),
    { initialProps: 'A' },
  );
  act(() => result.current[1]('B'));
  act(() => result.current[1]('B'));
  expect(changed.mock.calls).toEqual([['B'], ['B']]);
  expect(result.current[0]).toBe('A');

  rerender('B');
  expect(result.current[0]).toBe('B');
});

it('uses the latest accepted local value through a batch and ignores later defaults', () => {
  const changed = vi.fn<(value: string) => void>();
  const { result, rerender } = renderHook(
    (defaultValue) => useControllableState({ defaultValue, onChange: changed }),
    { initialProps: 'A' },
  );
  act(() => {
    result.current[1]('B');
    result.current[1]('B');
    result.current[1]('A');
  });
  expect(changed.mock.calls).toEqual([['B'], ['A']]);
  expect(result.current[0]).toBe('A');

  act(() => result.current[1]('accepted'));
  rerender('other default');
  expect(result.current[0]).toBe('accepted');
});

it.each([false, true])(
  'allows reentrant transitions and stops synchronous echoes (controlled=%s)',
  (controlled) => {
    const changed = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => {
      const [parentValue, setParentValue] = useState('A');
      return useControllableState({
        value: controlled ? parentValue : undefined,
        defaultValue: 'A',
        onChange(next: string): void {
          changed(next);
          if (controlled) {
            setParentValue(next);
          }
          if (next === 'B') {
            result.current[1]('B');
            result.current[1]('C');
          } else {
            result.current[1]('B');
          }
        },
      });
    });

    act(() => result.current[1]('B'));
    expect(changed.mock.calls).toEqual([['B'], ['C']]);
    expect(result.current[0]).toBe('C');
    act(() => result.current[1]('B'));
    expect(changed.mock.calls).toEqual([['B'], ['C'], ['B'], ['C']]);
    expect(result.current[0]).toBe('C');
  },
);

it('warns once and transfers the latest controlled value to local authority on release', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const initialProps: ControllableStateOptions<number | null> = { defaultValue: 1 };
  const { result, rerender } = renderHook(useControllableState<number | null>, { initialProps });
  const set = result.current[1];
  act(() => set(2));
  expect(result.current[0]).toBe(2);

  rerender({ value: 0, defaultValue: 3 });
  expect(result.current[0]).toBe(0);
  act(() => set(9));
  expect(result.current[0]).toBe(0);

  rerender({ value: null, defaultValue: 3 });
  expect(result.current[0]).toBeNull();
  rerender({ defaultValue: 4 });
  expect(result.current[0]).toBeNull();
  act(() => set(5));
  expect(result.current[0]).toBe(5);
  expect(result.current[1]).toBe(set);
  expect(warning).toHaveBeenCalledExactlyOnceWith(
    'useControllableState switched to controlled mode.',
  );
});

it('does not warn on mode switches in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const initialProps: ControllableStateOptions<string> = { value: 'A', defaultValue: 'default' };
    const { rerender } = renderHook(useControllableState<string>, { initialProps });
    rerender({ defaultValue: 'new default' });
    expect(warning).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
  }
});

it('takes a fresh object value from each controlled render', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { result, rerender } = renderHook(
    (label: string | undefined) =>
      useControllableState({
        value: label === undefined ? undefined : { label },
        defaultValue: { label: 'default' },
      }),
    { initialProps: 'A' },
  );
  rerender('B');
  expect(result.current[0]).toEqual({ label: 'B' });
  const latestValue = result.current[0];
  rerender();
  expect(result.current[0]).toBe(latestValue);
});

it('publishes the new callback before a descendant can propose a value in layout', () => {
  const previous = vi.fn<(value: string) => void>();
  const current = vi.fn<(value: string) => void>();

  function Child({ propose, submit }: { propose: (next: string) => void; submit: boolean }): null {
    useLayoutEffect(() => {
      if (submit) {
        propose('proposal');
      }
    }, [propose, submit]);
    return null;
  }

  function Parent({
    onChange,
    submit,
  }: {
    onChange: (next: string) => void;
    submit: boolean;
  }): ReactElement {
    const [, setValue] = useControllableState({
      value: 'value',
      defaultValue: 'default',
      onChange,
    });
    return <Child propose={setValue} submit={submit} />;
  }

  const { rerender } = render(<Parent onChange={previous} submit={false} />);
  rerender(<Parent onChange={current} submit />);
  expect(previous).not.toHaveBeenCalled();
  expect(current).toHaveBeenCalledExactlyOnceWith('proposal');
});

it('does not publish a setter callback or mode from a suspended render', async () => {
  const committed = vi.fn<(value: string) => void>();
  const speculative = vi.fn<(value: string) => void>();
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const pending = new Promise<never>(() => undefined);
  const attempted = vi.fn();

  function Editor({ suspend }: { suspend: boolean }): ReactElement {
    const [value, setValue] = useControllableState({
      value: suspend ? 'controlled' : undefined,
      defaultValue: 'local',
      onChange: suspend ? speculative : committed,
    });
    if (suspend) {
      attempted();
      use(pending);
    }
    return <button onClick={() => setValue('accepted')}>{value}</button>;
  }

  function App(): ReactElement {
    const [suspend, setSuspend] = useState(false);
    return (
      <>
        <button onClick={() => startTransition(() => setSuspend(true))}>Start transition</button>
        <Suspense fallback="Pending">
          <Editor suspend={suspend} />
        </Suspense>
      </>
    );
  }

  render(<App />);
  await act(() => fireEvent.click(screen.getByRole('button', { name: 'Start transition' })));
  expect(attempted).toHaveBeenCalled();
  expect(screen.queryByText('Pending')).toBeNull();
  await act(() => fireEvent.click(screen.getByRole('button', { name: 'local' })));
  expect(screen.getByRole('button', { name: 'accepted' })).toBeTruthy();
  expect(committed).toHaveBeenCalledExactlyOnceWith('accepted');
  expect(speculative).not.toHaveBeenCalled();
  expect(warning).not.toHaveBeenCalled();
});

it('discards a pending local update after controlled authority has taken over', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const attempted = vi.fn();
  let release: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  function Editor({ value }: { value?: string }): ReactElement {
    const [current, setValue] = useControllableState({ value, defaultValue: 'local' });
    if (current === 'queued') {
      attempted();
      use(pending);
    }
    return <button onClick={() => startTransition(() => setValue('queued'))}>{current}</button>;
  }

  function View({ value }: { value?: string }): ReactElement {
    return (
      <Suspense fallback="Pending">
        <Editor {...(value === undefined ? {} : { value })} />
      </Suspense>
    );
  }

  const { rerender } = render(<View />);
  await act(() => fireEvent.click(screen.getByRole('button', { name: 'local' })));
  expect(attempted).toHaveBeenCalled();
  rerender(<View value="external" />);
  expect(screen.getByRole('button', { name: 'external' })).toBeTruthy();
  rerender(<View />);

  await act(async () => {
    release();
    await pending;
  });
  expect(screen.getByRole('button', { name: 'external' })).toBeTruthy();
});

it('uses the layout phase in a browser and cleans up on unmount', () => {
  const called = vi.fn<(stage: string) => void>();
  const { unmount } = renderHook(() =>
    useIsoLayoutEffect(() => {
      called('attach');
      return () => called('detach');
    }, []),
  );
  expect(useIsoLayoutEffect).toBe(useLayoutEffect);
  unmount();
  expect(called.mock.calls).toEqual([['attach'], ['detach']]);
});

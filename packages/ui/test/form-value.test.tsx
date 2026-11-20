import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { startTransition, Suspense, use, useRef, useState } from 'react';
import type { JSX, ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormInput, writeInputValue, writeRadioGroup } from '../src/core/forms/carriers.js';
import { subscribeNativeReset } from '../src/core/forms/NativeResetWitness.js';
import { useFormValue } from '../src/core/forms/useFormValue.js';

afterEach(cleanup);

describe('useFormValue and native reset runtime (jsdom)', () => {
  it('repairs mutated DOM before a throwing proposal and delivers the same value again afterward', () => {
    const input = document.createElement('input');
    const form = document.createElement('form');
    input.name = 'value';
    form.append(input);
    const calls: [string, FormDataEntryValue | null][] = [];
    let shouldThrow = true;
    const changed = vi.fn((candidate: string) => {
      calls.push([candidate, new FormData(form).get('value')]);
      if (candidate === 'B' && shouldThrow) {
        shouldThrow = false;
        throw new Error('consumer callback failed');
      }
    });

    const { result, rerender } = renderHook(
      (value: string) =>
        useFormValue({
          value,
          defaultValue: 'A',
          getControl: () => input,
          write: (next, ctx) => writeInputValue(input, next, { syncDefault: ctx.controlled }),
          onChange: changed,
        }),
      { initialProps: 'A' },
    );

    // Mutate native DOM before proposal to prove immediate repair happens before onChange runs.
    input.value = 'B';
    expect(() => act(() => result.current.propose('B'))).toThrow('consumer callback failed');
    expect(input.value).toBe('A');

    // Proposing the exact same candidate 'B' must still be delivered (deliveries stack cleared in finally).
    input.value = 'B';
    act(() => result.current.propose('B'));
    rerender('C');
    act(() => result.current.propose('D'));

    expect(calls).toEqual([
      ['B', 'A'],
      ['B', 'A'],
      ['D', 'C'],
    ]);
    expect(input.value).toBe('C');
  });

  it('handles native form.reset() cleanly in jsdom without attachInternals, invoking onReset', async () => {
    const onResetLocal = vi.fn();
    const onResetControlled = vi.fn();

    function FormFixture(): JSX.Element {
      const localRef = useRef<HTMLInputElement>(null);
      const controlledRef = useRef<HTMLInputElement>(null);
      const [controlled, setControlled] = useState('init');
      const local = useFormValue<string>({
        defaultValue: 'mount-default',
        getControl: () => localRef.current,
        write: (next, ctx) => {
          if (localRef.current) {
            writeInputValue(localRef.current, next, { syncDefault: ctx.controlled });
          }
        },
        onReset: onResetLocal,
      });
      const ext = useFormValue<string>({
        value: controlled,
        defaultValue: 'init',
        getControl: () => controlledRef.current,
        write: (next, ctx) => {
          if (controlledRef.current) {
            writeInputValue(controlledRef.current, next, { syncDefault: ctx.controlled });
          }
        },
        onReset: onResetControlled,
      });
      return (
        <form data-testid="form">
          <FormInput
            ref={localRef}
            name="local"
            defaultValue={local.value}
            onChange={(e) => local.propose(e.currentTarget.value)}
          />
          <FormInput
            ref={controlledRef}
            controlled
            name="controlled"
            defaultValue={ext.value}
            onChange={(e) => ext.propose(e.currentTarget.value)}
          />
          <button type="button" onClick={() => local.propose('edited')}>
            Edit local
          </button>
          <button type="button" onClick={() => setControlled('committed')}>
            Commit controlled
          </button>
          <output data-testid="local">{local.value}</output>
          <output data-testid="controlled">{ext.value}</output>
        </form>
      );
    }

    render(<FormFixture />);
    const form = screen.getByTestId<HTMLFormElement>('form');
    fireEvent.click(screen.getByText('Edit local'));
    fireEvent.click(screen.getByText('Commit controlled'));
    expect(new FormData(form).get('local')).toBe('edited');
    expect(new FormData(form).get('controlled')).toBe('committed');

    await act(async () => {
      HTMLFormElement.prototype.reset.call(form);
      await Promise.resolve();
    });

    expect(screen.getByTestId('local').textContent).toBe('mount-default');
    expect(screen.getByTestId('controlled').textContent).toBe('committed');
    expect(new FormData(form).get('local')).toBe('mount-default');
    expect(new FormData(form).get('controlled')).toBe('committed');
    expect(onResetLocal).toHaveBeenCalledTimes(1);
    expect(onResetControlled).toHaveBeenCalledTimes(1);
  });

  it('is immune to HTMLFormElement DOM clobbering during reset', async () => {
    const form = document.createElement('form');
    const clobbers = [
      'parentNode',
      'append',
      'ownerDocument',
      'addEventListener',
      'removeEventListener',
      'elements',
    ];
    for (const name of clobbers) {
      const el = document.createElement('input');
      el.name = name;
      form.append(el);
    }
    const target = document.createElement('input');
    target.name = 'field';
    target.defaultValue = 'initial';
    form.append(target);
    document.body.append(form);

    try {
      const { result } = renderHook(() =>
        useFormValue<string>({
          defaultValue: 'initial',
          getControl: () => target,
          write: (next, ctx) => writeInputValue(target, next, { syncDefault: ctx.controlled }),
        }),
      );

      act(() => result.current.propose('dirty'));
      expect(target.value).toBe('dirty');

      await act(async () => {
        HTMLFormElement.prototype.reset.call(form);
        await Promise.resolve();
      });

      expect(result.current.value).toBe('initial');
      expect(target.value).toBe('initial');
    } finally {
      form.remove();
    }
  });

  it('clones Proxy-wrapped default arrays without DataCloneError and uses array equality for echo/no-op', () => {
    const input = document.createElement('input');
    const changed = vi.fn<(next: readonly string[]) => void>();
    const proxyDefault = new Proxy(['a', 'b'], {});

    const { result } = renderHook(() =>
      useFormValue<readonly string[]>({
        defaultValue: proxyDefault,
        getControl: () => input,
        write: (next) => {
          input.value = next.join(',');
        },
        onChange: (next) => {
          changed(next);
          // Reentrant equivalent array must be treated as an echo and stop recursion.
          result.current.propose([...next]);
        },
      }),
    );

    expect(result.current.value).toEqual(['a', 'b']);
    // Equivalent fresh array is a no-op in uncontrolled mode.
    act(() => result.current.propose(['a', 'b']));
    expect(changed).not.toHaveBeenCalled();

    act(() => result.current.propose(['c']));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith(['c']);
    expect(result.current.value).toEqual(['c']);
  });

  it('supports multi-control groups (getControls), skips idle writes, and isolates teardown/errors', async () => {
    const form = document.createElement('form');
    const radioA = document.createElement('input');
    radioA.type = 'radio';
    radioA.name = 'group';
    radioA.value = 'a';
    radioA.defaultChecked = true;
    const radioB = document.createElement('input');
    radioB.type = 'radio';
    radioB.name = 'group';
    radioB.value = 'b';
    const sibling = document.createElement('input');
    sibling.name = 'sibling';
    sibling.defaultValue = 's0';
    form.append(radioA, radioB, sibling);
    document.body.append(form);

    try {
      const writeGroup = vi.fn((next: string | null, ctx: { controlled: boolean }) => {
        writeRadioGroup([radioA, radioB], next, { syncDefault: ctx.controlled });
      });

      const { result, rerender } = renderHook(
        ({ dep, includeA }: { dep: number; includeA: boolean }) =>
          useFormValue<string | null>({
            defaultValue: 'a',
            getControls: () => (includeA ? [radioA, radioB] : [radioB]),
            writeDeps: [dep],
            write: writeGroup,
          }),
        { initialProps: { dep: 1, includeA: true } },
      );

      expect(writeGroup).toHaveBeenCalledTimes(1);
      // Idle rerender with unchanged value and writeDeps must not re-run write.
      rerender({ dep: 1, includeA: true });
      expect(writeGroup).toHaveBeenCalledTimes(1);

      // Disabling radioA does not block proposing on the group while radioB is enabled.
      radioA.disabled = true;
      act(() => result.current.propose('b'));
      expect(result.current.value).toBe('b');

      // Removing radioA from getControls keeps reset active via radioB.
      rerender({ dep: 1, includeA: false });
      await act(async () => {
        HTMLFormElement.prototype.reset.call(form);
        await Promise.resolve();
      });
      expect(result.current.value).toBe('a');

      // Idempotent double unsubscribe must never strip another live control's document listener.
      const sub1 = subscribeNativeReset(sibling, () => undefined);
      sub1.unsubscribe();
      const sub2Notify = vi.fn();
      const sub2 = subscribeNativeReset(sibling, sub2Notify);
      sub1.unsubscribe(); // second call must be a no-op
      await act(async () => {
        HTMLFormElement.prototype.reset.call(form);
        await Promise.resolve();
      });
      expect(sub2Notify).toHaveBeenCalledWith('reset');
      sub2.unsubscribe();

      // A throwing subscription during reset must not prevent sibling subscriptions from running.
      const throwing = subscribeNativeReset(radioB, () => {
        throw new Error('broken writer');
      });
      const healthyNotify = vi.fn();
      const healthy = subscribeNativeReset(sibling, healthyNotify);
      const reportSpy = vi.fn();
      vi.stubGlobal('reportError', reportSpy);
      try {
        await act(async () => {
          HTMLFormElement.prototype.reset.call(form);
          await Promise.resolve();
        });
      } finally {
        vi.unstubAllGlobals();
        throwing.unsubscribe();
        healthy.unsubscribe();
      }
      expect(healthyNotify).toHaveBeenCalledWith('reset');
      expect(reportSpy).toHaveBeenCalledTimes(1);
    } finally {
      form.remove();
    }
  });

  it('reconciles suspended uncontrolled startTransition so urgent writes are not swallowed', async () => {
    const input = document.createElement('input');
    const pending = new Promise<never>(() => undefined);

    function Editor(): ReactElement {
      const field = useFormValue<string>({
        defaultValue: 'local',
        getControl: () => input,
        write: (next) => writeInputValue(input, next),
      });
      if (field.value === 'queued') {
        use(pending);
      }
      return (
        <>
          <output data-testid="val">{field.value}</output>
          <button type="button" onClick={() => startTransition(() => field.propose('queued'))}>
            Queue
          </button>
          <button type="button" onClick={() => field.propose('urgent')}>
            Urgent
          </button>
        </>
      );
    }

    render(
      <Suspense fallback="Pending">
        <Editor />
      </Suspense>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Queue'));
      await Promise.resolve();
    });
    // Suspended transition reconciled back to committed 'local'.
    expect(screen.getByTestId('val').textContent).toBe('local');
    expect(input.value).toBe('local');

    fireEvent.click(screen.getByText('Urgent'));
    expect(screen.getByTestId('val').textContent).toBe('urgent');
    expect(input.value).toBe('urgent');
  });

  it('keeps React and DOM synchronized if uncontrolled write throws', () => {
    const input = document.createElement('input');
    input.value = 'initial';
    let fail = true;
    const changed = vi.fn();

    const { result } = renderHook(() =>
      useFormValue<string>({
        defaultValue: 'initial',
        getControl: () => input,
        write: (next) => {
          if (fail && next === 'next') {
            fail = false;
            throw new Error('write failed');
          }
          input.value = next;
        },
        onChange: changed,
      }),
    );

    expect(() => act(() => result.current.propose('next'))).toThrow('write failed');
    expect(result.current.value).toBe('initial');
    expect(input.value).toBe('initial');
    expect(changed).not.toHaveBeenCalled();

    // Retrying 'next' succeeds because state was not prematurely mutated.
    act(() => result.current.propose('next'));
    expect(result.current.value).toBe('next');
    expect(input.value).toBe('next');
    expect(changed).toHaveBeenCalledExactlyOnceWith('next');
  });
});

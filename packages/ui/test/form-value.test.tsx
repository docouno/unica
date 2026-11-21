import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { Component, startTransition, Suspense, use, useRef, useState } from 'react';
import type { JSX, ReactElement, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  writeInputChecked,
  writeInputValue,
  writeRadioGroup,
  writeSelectValue,
  writeTextareaValue,
} from '../src/core/forms/carriers.js';
import { subscribeNativeReset } from '../src/core/forms/NativeResetWitness.js';
import { useFormValue } from '../src/core/forms/useFormValue.js';

type RemoveListenerFn = (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | EventListenerOptions,
) => void;

const removedListeners: { target: EventTarget; type: string }[] = [];
let originalRemoveListener: RemoveListenerFn;

beforeAll(() => {
  const rawRemove: unknown = Reflect.get(EventTarget.prototype, 'removeEventListener');
  originalRemoveListener = rawRemove as RemoveListenerFn;
  EventTarget.prototype.removeEventListener = function removeEventListener(
    type,
    listener,
    options,
  ) {
    removedListeners.push({ target: this, type });
    Reflect.apply(originalRemoveListener, this, [type, listener, options]);
  };
});

afterAll(() => {
  Reflect.set(EventTarget.prototype, 'removeEventListener', originalRemoveListener);
});

beforeEach(() => {
  removedListeners.length = 0;
});

class TestErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

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
            writeInputValue(localRef.current, next, {
              syncDefault: ctx.controlled,
              force: ctx.force,
            });
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
            writeInputValue(controlledRef.current, next, {
              syncDefault: ctx.controlled,
              force: ctx.force,
            });
          }
        },
        onReset: onResetControlled,
      });
      return (
        <form data-testid="form">
          <FormInput
            ref={localRef}
            controlled={local.controlled}
            name="local"
            aria-label="Local input"
            defaultValue={local.value}
            onChange={(e) => local.propose(e.currentTarget.value)}
          />
          <FormInput
            ref={controlledRef}
            controlled={ext.controlled}
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

    // Re-entering the exact pre-reset value must still trigger React's onChange (_valueTracker synced).
    fireEvent.change(screen.getByLabelText('Local input'), { target: { value: 'edited' } });
    expect(screen.getByTestId('local').textContent).toBe('edited');
    expect(new FormData(form).get('local')).toBe('edited');
  });

  it('is immune to HTMLFormElement DOM clobbering during reset', async () => {
    const form = document.createElement('form');
    const clobbers = [
      'nodeType',
      'parentNode',
      'parentElement',
      'append',
      'ownerDocument',
      'addEventListener',
      'removeEventListener',
      'elements',
    ];
    for (const name of clobbers) {
      const el = document.createElement('input');
      el.name = name;
      Element.prototype.append.call(form, el);
    }
    const target = document.createElement('input');
    target.name = 'field';
    target.defaultValue = 'initial';
    Element.prototype.append.call(form, target);
    document.body.append(form);

    try {
      const { result } = renderHook(() =>
        useFormValue<string>({
          defaultValue: 'initial',
          getControl: () => target,
          write: (next, ctx) =>
            writeInputValue(target, next, { syncDefault: ctx.controlled, force: ctx.force }),
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

  it('preserves pending uncontrolled non-discrete updates without rollback, duplicate onChange, or DOM thrash', async () => {
    const input = document.createElement('input');
    const form = document.createElement('form');
    input.name = 'slider';
    input.defaultValue = 'A';
    form.append(input);
    document.body.append(form);
    const changed = vi.fn<(value: string) => void>();
    const writes = vi.fn<(value: string) => void>();

    try {
      const { result, rerender } = renderHook(
        ({ tick }: { tick: number }) => {
          void tick;
          return useFormValue<string>({
            defaultValue: 'A',
            getControl: () => input,
            write: (next, ctx) => {
              writes(next);
              writeInputValue(input, next, { syncDefault: ctx.controlled, force: ctx.force });
            },
            onChange: changed,
          });
        },
        { initialProps: { tick: 0 } },
      );

      expect(writes.mock.calls).toEqual([['A']]);

      // Non-discrete DefaultEventPriority update (Promise.then / setTimeout without flushSync).
      await act(async () => {
        await Promise.resolve().then(() => {
          result.current.propose('B');
          // Duplicate proposal before macrotask commits must not emit duplicate onChange.
          result.current.propose('B');
        });
      });

      expect(result.current.value).toBe('B');
      expect(input.value).toBe('B');
      expect(changed.mock.calls).toEqual([['B']]);
      // No rollback back to 'A' and no 3x thrash.
      expect(writes.mock.calls.filter(([v]) => v === 'A')).toHaveLength(1);

      // Unrelated parent rerender while a non-discrete update is pending preserves latestValue.
      await act(async () => {
        setTimeout(() => {
          result.current.propose('C');
        }, 0);
        await new Promise((resolve) => setTimeout(resolve, 10));
        rerender({ tick: 1 });
      });
      expect(result.current.value).toBe('C');
      expect(input.value).toBe('C');

      // Native form.reset() restores 'A' cleanly even after non-discrete updates.
      await act(async () => {
        HTMLFormElement.prototype.reset.call(form);
        await Promise.resolve();
      });
      expect(result.current.value).toBe('A');
      expect(input.value).toBe('A');
    } finally {
      form.remove();
    }
  });

  it('allows urgent writes and unrelated rerenders during a suspended uncontrolled startTransition without rollback or swallowing', async () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'queued';
    input.defaultValue = 'local';
    form.append(input);
    document.body.append(form);
    const pending = new Promise<never>(() => undefined);
    const changed = vi.fn<(value: string) => void>();
    const writes = vi.fn<(value: string) => void>();

    function Editor({ tick }: { tick: number }): ReactElement {
      void tick;
      const field = useFormValue<string>({
        defaultValue: 'local',
        getControl: () => input,
        write: (next, ctx) => {
          writes(next);
          writeInputValue(input, next, { syncDefault: ctx.controlled, force: ctx.force });
        },
        // Inline callback ensures useControllableState's useInsertionEffect re-runs on unrelated rerenders.
        onChange: (next) => changed(next),
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
          <button type="button" onClick={() => field.propose('queued')}>
            Retry queued
          </button>
          <button type="button" onClick={() => field.propose('urgent')}>
            Urgent
          </button>
        </>
      );
    }

    try {
      const { rerender } = render(
        <Suspense fallback={<output data-testid="fallback">Pending</output>}>
          <Editor tick={0} />
        </Suspense>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Queue'));
        await Promise.resolve();
      });
      expect(screen.getByTestId('val').textContent).toBe('local');
      expect(input.value).toBe('queued');
      expect(changed.mock.calls).toEqual([['queued']]);

      // Unrelated parent rerender while local update remains uncommitted must preserve latestValue ('queued')
      // in useControllableState's useInsertionEffect without writing 'local' back into the DOM.
      const writesBeforeRerender = writes.mock.calls.length;
      await act(async () => {
        rerender(
          <Suspense fallback={<output data-testid="fallback">Pending</output>}>
            <Editor tick={1} />
          </Suspense>,
        );
        await Promise.resolve();
      });
      expect(screen.getByTestId('val').textContent).toBe('local');
      expect(input.value).toBe('queued');
      expect(writes).toHaveBeenCalledTimes(writesBeforeRerender);

      // Urgent write to a new value commits cleanly.
      await act(async () => {
        fireEvent.click(screen.getByText('Urgent'));
        await Promise.resolve();
      });
      expect(screen.getByTestId('val').textContent).toBe('urgent');
      expect(input.value).toBe('urgent');

      // Re-queue suspended transition, then repeat the same value urgently: upgrades lane without duplicate onChange.
      await act(async () => {
        fireEvent.click(screen.getByText('Queue'));
        await Promise.resolve();
      });
      expect(changed.mock.calls).toEqual([['queued'], ['urgent'], ['queued']]);
      await act(async () => {
        fireEvent.click(screen.getByText('Retry queued'));
        await Promise.resolve();
      });
      expect(screen.getByTestId('fallback').textContent).toBe('Pending');
      expect(changed.mock.calls).toEqual([['queued'], ['urgent'], ['queued']]);
    } finally {
      form.remove();
    }
  });

  it('syncs _valueTracker on empty controlled FormInput/FormTextarea after programmatic updates and skips unmounted reset siblings', async () => {
    function EmptyControlledEditors(): ReactElement {
      const inputRef = useRef<HTMLInputElement>(null);
      const areaRef = useRef<HTMLTextAreaElement>(null);
      const [inputVal, setInputVal] = useState('');
      const [areaVal, setAreaVal] = useState('');
      const inputField = useFormValue<string>({
        value: inputVal,
        defaultValue: '',
        commitMode: 'deferred',
        getControl: () => inputRef.current,
        write: (next, ctx) => {
          if (inputRef.current) {
            writeInputValue(inputRef.current, next, {
              syncDefault: ctx.controlled,
              force: ctx.force,
            });
          }
        },
        onChange: setInputVal,
      });
      const areaField = useFormValue<string>({
        value: areaVal,
        defaultValue: '',
        commitMode: 'deferred',
        getControl: () => areaRef.current,
        write: (next, ctx) => {
          if (areaRef.current) {
            writeTextareaValue(areaRef.current, next, {
              syncDefault: ctx.controlled,
              force: ctx.force,
            });
          }
        },
        onChange: setAreaVal,
      });
      return (
        <form>
          <FormInput
            ref={inputRef}
            controlled={inputField.controlled}
            aria-label="Empty controlled input"
            defaultValue={inputField.value}
            onChange={(e) => inputField.propose(e.currentTarget.value)}
          />
          <FormTextarea
            ref={areaRef}
            controlled={areaField.controlled}
            aria-label="Empty controlled textarea"
            defaultValue={areaField.value}
            onChange={(e) => areaField.propose(e.currentTarget.value)}
          />
          <button
            type="button"
            onClick={() => {
              setInputVal('preset');
              setAreaVal('draft');
            }}
          >
            Fill presets
          </button>
          <output data-testid="empty-input-val">{inputVal}</output>
          <output data-testid="empty-area-val">{areaVal}</output>
        </form>
      );
    }

    render(<EmptyControlledEditors />);
    fireEvent.click(screen.getByText('Fill presets'));
    expect(screen.getByTestId('empty-input-val').textContent).toBe('preset');
    expect(screen.getByTestId('empty-area-val').textContent).toBe('draft');

    // Clearing back to '' (initial value) must fire React onChange rather than being swallowed by a stale _valueTracker.
    fireEvent.change(screen.getByLabelText('Empty controlled input'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Empty controlled textarea'), { target: { value: '' } });
    expect(screen.getByTestId('empty-input-val').textContent).toBe('');
    expect(screen.getByTestId('empty-area-val').textContent).toBe('');

    // Sibling unmounted during Field A's onReset must not receive post-unmount write() or onReset().
    const siblingWrite = vi.fn();
    const siblingReset = vi.fn();

    function SiblingField(): ReactElement {
      const ref = useRef<HTMLInputElement>(null);
      const field = useFormValue<string>({
        defaultValue: 'b0',
        getControl: () => ref.current,
        write: (next, ctx) => {
          siblingWrite(next);
          if (ref.current) {
            writeInputValue(ref.current, next, { syncDefault: ctx.controlled, force: ctx.force });
          }
        },
        onReset: siblingReset,
      });
      return (
        <FormInput
          ref={ref}
          controlled={field.controlled}
          name="b"
          defaultValue={field.value}
          onChange={(e) => field.propose(e.currentTarget.value)}
        />
      );
    }

    function ResetUnmountsSibling(): ReactElement {
      const refA = useRef<HTMLInputElement>(null);
      const [showB, setShowB] = useState(true);
      const fieldA = useFormValue<string>({
        defaultValue: 'a0',
        getControl: () => refA.current,
        write: (next, ctx) => {
          if (refA.current) {
            writeInputValue(refA.current, next, { syncDefault: ctx.controlled, force: ctx.force });
          }
        },
        onReset: () => {
          flushSync(() => setShowB(false));
        },
      });
      return (
        <form data-testid="unmount-reset-form">
          <FormInput
            ref={refA}
            controlled={fieldA.controlled}
            name="a"
            defaultValue={fieldA.value}
            onChange={(e) => fieldA.propose(e.currentTarget.value)}
          />
          {showB && <SiblingField />}
        </form>
      );
    }

    render(<ResetUnmountsSibling />);
    const writesBeforeReset = siblingWrite.mock.calls.length;
    await act(async () => {
      HTMLFormElement.prototype.reset.call(
        screen.getByTestId<HTMLFormElement>('unmount-reset-form'),
      );
      await Promise.resolve();
    });
    expect(siblingReset).not.toHaveBeenCalled();
    expect(siblingWrite).toHaveBeenCalledTimes(writesBeforeReset);
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

  it('cleans up reset listeners if initial write throws, guards deferred post-unmount/throwing edits, and prunes FormSelect options without insertBefore churn', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const brokenInput = document.createElement('input');
      const form = document.createElement('form');
      form.append(brokenInput);
      document.body.append(form);
      const writeAttempt = vi.fn(() => {
        throw new Error('initial write failed');
      });

      function BrokenWriter(): ReactElement {
        useFormValue<string>({
          defaultValue: 'a',
          getControl: () => brokenInput,
          write: writeAttempt,
        });
        return <div />;
      }

      removedListeners.length = 0;
      render(
        <TestErrorBoundary fallback={<output data-testid="caught">caught</output>}>
          <BrokenWriter />
        </TestErrorBoundary>,
      );
      expect(screen.getByTestId('caught').textContent).toBe('caught');
      const removedResets = removedListeners.filter(
        (entry) => entry.target === document && entry.type === 'reset',
      );
      expect(removedResets).toHaveLength(1);

      // Resetting the form after error unmount must not invoke the discarded subscription.
      const attemptsBeforeReset = writeAttempt.mock.calls.length;
      await act(async () => {
        HTMLFormElement.prototype.reset.call(form);
        await Promise.resolve();
      });
      expect(writeAttempt).toHaveBeenCalledTimes(attemptsBeforeReset);
      form.remove();
    } finally {
      errorSpy.mockRestore();
    }

    // Deferred commitMode: throwing onChange still repairs DOM, unmount skips post-unmount write, accepted skips duplicate write.
    const liveInput = document.createElement('input');
    liveInput.value = 'a';
    const writeSpy = vi.fn((next: string, ctx: { controlled: boolean; force: boolean }) => {
      writeInputValue(liveInput, next, { syncDefault: ctx.controlled, force: ctx.force });
    });
    let mode: 'throw' | 'accept' | 'unmount' = 'throw';
    let triggerUnmount = (): void => undefined;

    const { result, unmount } = renderHook(() => {
      const [val, setVal] = useState('a');
      return useFormValue<string>({
        value: val,
        defaultValue: 'a',
        commitMode: 'deferred',
        getControl: () => liveInput,
        write: writeSpy,
        onChange: (next) => {
          if (mode === 'throw') {
            throw new Error('deferred onChange failed');
          }
          if (mode === 'accept') {
            setVal(next);
          }
          if (mode === 'unmount') {
            triggerUnmount();
          }
        },
      });
    });
    triggerUnmount = unmount;

    expect(writeSpy).toHaveBeenCalledTimes(1);

    // 1. Throwing onChange in deferred mode still repairs mutated DOM in microtask.
    liveInput.value = 'bad';
    expect(() => act(() => result.current.propose('bad'))).toThrow('deferred onChange failed');
    await act(async () => {
      await Promise.resolve();
    });
    expect(liveInput.value).toBe('a');
    expect(writeSpy).toHaveBeenCalledTimes(2);

    // 2. Accepted deferred edit runs write ONCE (on commit), not twice (microtask sees writeEpoch changed).
    mode = 'accept';
    liveInput.value = 'good';
    act(() => {
      result.current.propose('good');
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(liveInput.value).toBe('good');
    expect(writeSpy).toHaveBeenCalledTimes(3);

    // 3. Unmount during deferred onChange does not execute a post-unmount write.
    mode = 'unmount';
    liveInput.value = 'ghost';
    await act(async () => {
      result.current.propose('ghost');
      await Promise.resolve();
    });
    expect(writeSpy).toHaveBeenCalledTimes(3);

    // 4. Removing a leading option in writeSelectValue prunes first with zero insertBefore churn on trailing options.
    const selectRef = { current: null as HTMLSelectElement | null };
    const options = [{ value: 'a' }, { value: 'b' }, { value: 'c' }, { value: 'd' }];
    render(
      <FormSelect
        ref={(node) => {
          selectRef.current = node;
        }}
        name="list"
        initialValue="b"
        initialOptions={options}
        getFocusTarget={() => null}
      />,
    );
    const select = selectRef.current!;
    const group = select.querySelector('optgroup')!;
    const insertSpy = vi.spyOn(group, 'insertBefore');
    writeSelectValue(select, 'b', options.slice(1), { controlled: false, defaultValue: 'b' });
    expect(insertSpy).not.toHaveBeenCalled();
    expect([...group.children].map((opt) => (opt as HTMLOptionElement).value)).toEqual([
      'b',
      'c',
      'd',
    ]);
    insertSpy.mockRestore();

    // 5. Checkbox writeInputChecked with force: true syncs React _valueTracker after native form.reset().
    function CheckboxReset(): ReactElement {
      const boxRef = useRef<HTMLInputElement>(null);
      const box = useFormValue<boolean>({
        defaultValue: true,
        getControl: () => boxRef.current,
        write: (next, ctx) => {
          if (boxRef.current) {
            writeInputChecked(boxRef.current, next, {
              syncDefault: ctx.controlled,
              force: ctx.force,
            });
          }
        },
      });
      return (
        <form data-testid="box-form">
          <FormInput
            ref={boxRef}
            controlled={box.controlled}
            type="checkbox"
            aria-label="Reset box"
            defaultChecked={box.value}
            onChange={(e) => box.propose(e.currentTarget.checked)}
          />
          <output data-testid="box-val">{String(box.value)}</output>
        </form>
      );
    }
    render(<CheckboxReset />);
    const checkbox = screen.getByLabelText<HTMLInputElement>('Reset box');
    fireEvent.click(checkbox);
    expect(screen.getByTestId('box-val').textContent).toBe('false');
    await act(async () => {
      HTMLFormElement.prototype.reset.call(screen.getByTestId<HTMLFormElement>('box-form'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('box-val').textContent).toBe('true');
    fireEvent.click(checkbox);
    expect(screen.getByTestId('box-val').textContent).toBe('false');
  });
});

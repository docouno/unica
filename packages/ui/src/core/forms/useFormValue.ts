import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import { useStateAuthority } from '../useControllableState.js';
import type { ControllableStateOptions } from '../useControllableState.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { subscribeNativeReset } from './NativeResetWitness.js';
import type { FormControl, NativeResetSubscription } from './NativeResetWitness.js';

export interface FormWriteContext<T> {
  readonly controlled: boolean;
  readonly defaultValue: T;
  readonly force: boolean;
}

export interface FormValueOptions<T> extends ControllableStateOptions<T> {
  readonly getControl?: (() => FormControl | null) | undefined;
  readonly getControls?: (() => readonly (FormControl | null)[]) | undefined;
  readonly write: (value: T, context: FormWriteContext<T>) => void;
  readonly writeDeps?: readonly unknown[] | undefined;
  readonly readOnly?: boolean | undefined;
  readonly commitMode?: 'immediate' | 'deferred' | undefined;
  readonly cloneDefault?: ((value: T) => T) | undefined;
  readonly onReset?: (() => void) | undefined;
}

export interface FormValueState<T> {
  readonly value: T;
  readonly controlled: boolean;
  readonly propose: (next: T, source?: FormControl) => void;
}

function defaultIsEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (let index = 0; index < a.length; index++) {
      if (!Object.is(a[index], b[index])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function defaultClone<T>(value: T): T {
  // Shallow-copy arrays without structuredClone so Proxy-wrapped arrays (MobX/Valtio/Immer) never throw.
  return (Array.isArray(value) ? Array.from(value) : value) as T;
}

function readControls<T>(options: FormValueOptions<T>): FormControl[] {
  const result: FormControl[] = [];
  if (options.getControls) {
    for (const control of options.getControls()) {
      if (control) {
        result.push(control);
      }
    }
    return result;
  }
  const single = options.getControl?.();
  if (single) {
    result.push(single);
  }
  return result;
}

function sameList(a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index++) {
    if (!Object.is(a[index], b[index])) {
      return false;
    }
  }
  return true;
}

interface WrittenSnapshot<T> {
  readonly value: T;
  readonly controlled: boolean;
  readonly controls: readonly FormControl[];
  readonly writeDeps: readonly unknown[] | undefined;
}

export function useFormValue<T>(options: FormValueOptions<T>): FormValueState<T> {
  const isEqual = options.isEqual ?? defaultIsEqual;
  const controlled = options.value !== undefined;
  const [initial] = useState(() => (options.cloneDefault ?? defaultClone)(options.defaultValue));
  const [value, { read, propose, restore }] = useStateAuthority({
    value: options.value,
    defaultValue: initial,
    onChange: options.onChange,
    isEqual,
  });
  const config = useRef(options);
  const controlledRef = useRef(controlled);
  const mountedRef = useRef(true);
  const writeEpoch = useRef(0);
  const binding = useRef<(NativeResetSubscription & { controls: readonly FormControl[] }) | null>(
    null,
  );
  const lastWritten = useRef<WrittenSnapshot<T> | null>(null);

  useInsertionEffect(() => {
    config.current = options;
    controlledRef.current = controlled;
  });

  // Register unmount cleanup before the sync effect so a throwing initial write
  // can never strand a document-level reset subscription.
  useIsoLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const current = binding.current;
      binding.current = null;
      lastWritten.current = null;
      current?.unsubscribe();
    };
  }, []);

  const writeWith = useCallback(
    (next: T, force: boolean, preReadControls?: readonly FormControl[]): void => {
      const currentOptions = config.current;
      const controls = preReadControls ?? readControls(currentOptions);
      currentOptions.write(next, {
        controlled: controlledRef.current,
        defaultValue: initial,
        force,
      });
      writeEpoch.current += 1;
      lastWritten.current = {
        value: next,
        controlled: controlledRef.current,
        controls,
        writeDeps: currentOptions.writeDeps,
      };
    },
    [initial],
  );

  const write = useCallback((next: T): void => writeWith(next, false), [writeWith]);
  const forceWrite = useCallback((next: T): void => writeWith(next, true), [writeWith]);

  const request = useCallback(
    (next: T, source?: FormControl): void => {
      const currentOptions = config.current;
      const controls = readControls(currentOptions);
      const disabled = source
        ? source.matches(':disabled')
        : controls.length > 0 && controls.every((control) => control.matches(':disabled'));
      if (currentOptions.readOnly || disabled) {
        writeWith(read(), true, controls);
        return;
      }

      if (currentOptions.commitMode === 'deferred' && controlledRef.current) {
        // Live text inputs keep browser selection, undo stack, and IME intact while
        // the controlled owner decides; rejected proposals repair right after commit.
        const epochBefore = writeEpoch.current;
        try {
          propose(next);
        } finally {
          queueMicrotask(() => {
            if (mountedRef.current && writeEpoch.current === epochBefore) {
              writeWith(read(), true);
            }
          });
        }
        return;
      }
      propose(next, write);
    },
    [propose, read, write, writeWith],
  );

  useIsoLayoutEffect(() => {
    const controls = readControls(config.current);
    const previous = binding.current;
    if (controls.length === 0) {
      binding.current = null;
      lastWritten.current = null;
      previous?.unsubscribe();
      return;
    }

    if (!previous || !sameList(previous.controls, controls)) {
      binding.current = null;
      previous?.unsubscribe();
      const subscription = subscribeNativeReset(controls, (result) => {
        if (!mountedRef.current) {
          return;
        }
        if (result === 'reset') {
          restore(initial, forceWrite);
          config.current.onReset?.();
        } else {
          forceWrite(read());
        }
      });
      binding.current = { controls, ...subscription };
    } else {
      previous.syncRoots();
    }

    const current = read();
    const prevWritten = lastWritten.current;
    const eq = config.current.isEqual ?? defaultIsEqual;
    const controlsChanged = !prevWritten || !sameList(prevWritten.controls, controls);
    const needsWrite =
      controlsChanged ||
      prevWritten.controlled !== controlledRef.current ||
      !eq(prevWritten.value, current) ||
      !sameList(prevWritten.writeDeps, config.current.writeDeps);

    if (needsWrite) {
      // Force the JS setter once on mount/hydration/control swap so the HTML dirty value/checkedness
      // flag is set and later defaultValue syncs never bypass React's _valueTracker.
      writeWith(current, controlsChanged, controls);
    }
  });

  return { value, controlled, propose: request };
}

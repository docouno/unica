import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import { useStateAuthority } from '../useControllableState.js';
import type { ControllableStateOptions } from '../useControllableState.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { subscribeNativeReset } from './NativeResetWitness.js';
import type { FormControl, NativeResetSubscription } from './NativeResetWitness.js';

export interface FormWriteContext<T> {
  readonly controlled: boolean;
  readonly defaultValue: T;
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
  value: T;
  propose: (next: T, source?: FormControl) => void;
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
  const binding = useRef<(NativeResetSubscription & { controls: readonly FormControl[] }) | null>(
    null,
  );
  const lastWritten = useRef<WrittenSnapshot<T> | null>(null);

  useInsertionEffect(() => {
    config.current = options;
    controlledRef.current = controlled;
  });

  const write = useCallback(
    (next: T): void => {
      const currentOptions = config.current;
      const controls = readControls(currentOptions);
      currentOptions.write(next, {
        controlled: controlledRef.current,
        defaultValue: initial,
      });
      lastWritten.current = {
        value: next,
        controlled: controlledRef.current,
        controls,
        writeDeps: currentOptions.writeDeps,
      };
    },
    [initial],
  );

  const request = useCallback(
    (next: T, source?: FormControl): void => {
      const currentOptions = config.current;
      const controls = readControls(currentOptions);
      const disabled = source
        ? source.matches(':disabled')
        : controls.length > 0 && controls.every((control) => control.matches(':disabled'));
      if (currentOptions.readOnly || disabled) {
        write(read());
        return;
      }

      if (currentOptions.commitMode === 'deferred' && controlledRef.current) {
        // Live text inputs keep browser selection, undo stack, and IME intact while
        // the controlled owner decides; rejected proposals repair right after commit.
        try {
          propose(next);
        } finally {
          queueMicrotask(() => {
            write(read());
          });
        }
        return;
      }
      propose(next, write);
    },
    [propose, read, write],
  );

  useIsoLayoutEffect(() => {
    const controls = readControls(config.current);
    const previous = binding.current;
    if (controls.length === 0) {
      binding.current = null;
      previous?.unsubscribe();
      return;
    }

    if (!previous || !sameList(previous.controls, controls)) {
      binding.current = null;
      previous?.unsubscribe();
      const subscription = subscribeNativeReset(controls, (result) => {
        if (result === 'reset') {
          restore(initial, write);
          config.current.onReset?.();
        } else {
          write(read());
        }
      });
      binding.current = { controls, ...subscription };
    } else {
      previous.syncRoots();
    }

    const current = read();
    const prevWritten = lastWritten.current;
    const eq = config.current.isEqual ?? defaultIsEqual;
    const needsWrite =
      !prevWritten ||
      prevWritten.controlled !== controlledRef.current ||
      !eq(prevWritten.value, current) ||
      !sameList(prevWritten.controls, controls) ||
      !sameList(prevWritten.writeDeps, config.current.writeDeps);

    if (needsWrite) {
      write(current);
    }
  });

  useIsoLayoutEffect(
    () => () => {
      const current = binding.current;
      binding.current = null;
      current?.unsubscribe();
    },
    [],
  );

  return { value, propose: request };
}

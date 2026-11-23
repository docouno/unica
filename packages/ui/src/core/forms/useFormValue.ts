import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import { isInertElement, matchesSafe } from '../dom.js';
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
  readonly readInitialValue?: ((control: FormControl) => T) | undefined;
  readonly shouldWrite?: (() => boolean) | undefined;
  readonly beforeReset?: (() => void) | undefined;
  readonly onReset?: (() => void) | undefined;
  readonly normalize?: ((value: T) => T) | undefined;
  readonly prepareReset?: ((value: T, defaultValue: T) => () => void) | undefined;
}

export interface FormValueState<T> {
  readonly value: T;
  readonly defaultValue: T;
  readonly controlled: boolean;
  readonly adopt: (next: T) => void;
  readonly read: () => T;
  readonly propose: (next: T, source?: FormControl) => void;
  readonly reconcile: () => void;
  readonly repair: () => void;
  readonly settleReset: () => void;
  readonly sync: () => void;
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
  const [rawValue, { read: readRaw, propose, restore }] = useStateAuthority({
    value:
      options.value === undefined
        ? undefined
        : (options.normalize?.(options.value) ?? options.value),
    defaultValue: options.normalize?.(initial) ?? initial,
    onChange: options.onChange,
    isEqual,
  });
  const config = useRef(options);
  const controlledRef = useRef(controlled);
  const mountedRef = useRef(true);
  const writeEpoch = useRef(0);
  const hasAttached = useRef(false);
  const binding = useRef<(NativeResetSubscription & { controls: readonly FormControl[] }) | null>(
    null,
  );
  const lastWritten = useRef<WrittenSnapshot<T> | null>(null);

  useInsertionEffect(() => {
    config.current = options;
    controlledRef.current = controlled;
  });

  const read = useCallback((): T => {
    const current = readRaw();
    return config.current.normalize?.(current) ?? current;
  }, [readRaw]);

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
      if (currentOptions.shouldWrite?.() === false) {
        return;
      }
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
  const settleReset = useCallback((): void => binding.current?.flushCompleted(), []);
  const reconcileValue = useCallback(
    (force: boolean): void => {
      if (mountedRef.current) {
        binding.current?.syncTargets();
        settleReset();
        writeWith(read(), force);
      }
    },
    [read, settleReset, writeWith],
  );
  const reconcile = useCallback((): void => reconcileValue(false), [reconcileValue]);
  const repair = useCallback((): void => reconcileValue(true), [reconcileValue]);

  const request = useCallback(
    (next: T, source?: FormControl): void => {
      binding.current?.syncTargets();
      settleReset();
      const currentOptions = config.current;
      const controls = readControls(currentOptions);
      const isBlocked = (control: FormControl): boolean =>
        matchesSafe(control, ':disabled') || isInertElement(control);
      const blocked = source ? isBlocked(source) : controls.length > 0 && controls.every(isBlocked);
      if (currentOptions.readOnly || blocked) {
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
    [propose, read, settleReset, write, writeWith],
  );

  const sync = useCallback((): void => {
    if (!mountedRef.current) {
      return;
    }
    const controls = readControls(config.current);
    const previous = binding.current;
    if (controls.length === 0) {
      binding.current = null;
      lastWritten.current = null;
      previous?.unsubscribe();
      return;
    }

    previous?.flushCompleted();
    if (!previous || !sameList(previous.controls, controls)) {
      binding.current = null;
      previous?.unsubscribe();
      const subscription = subscribeNativeReset(
        controls,
        (result) => {
          if (!mountedRef.current) {
            return;
          }
          if (result === 'reset') {
            config.current.beforeReset?.();
            restore(config.current.normalize?.(initial) ?? initial, forceWrite);
            config.current.onReset?.();
          } else {
            forceWrite(read());
          }
        },
        config.current.prepareReset
          ? () => config.current.prepareReset?.(read(), initial) ?? (() => {})
          : undefined,
      );
      binding.current = { controls, ...subscription };
    } else {
      previous.syncTargets();
    }

    if (!hasAttached.current) {
      hasAttached.current = true;
      const readInitialValue = config.current.readInitialValue;
      const control = controls[0];
      if (!controlledRef.current && control && readInitialValue) {
        restore(readInitialValue(control), (next) => writeWith(next, true, controls));
        return;
      }
    }

    const raw = readRaw();
    const current = config.current.normalize?.(raw) ?? raw;
    const prevWritten = lastWritten.current;
    const eq = config.current.isEqual ?? defaultIsEqual;
    const controlsChanged = !prevWritten || !sameList(prevWritten.controls, controls);
    const needsWrite =
      controlsChanged ||
      prevWritten.controlled !== controlledRef.current ||
      !eq(prevWritten.value, current) ||
      !sameList(prevWritten.writeDeps, config.current.writeDeps);

    if (!controlledRef.current && !eq(raw, current)) {
      // Preserve a narrowed uncontrolled value when the domain expands again.
      restore(current, (next) => writeWith(next, controlsChanged, controls));
    } else if (needsWrite) {
      // Force the JS setter once on mount/hydration/control swap so the HTML dirty value/checkedness
      // flag is set and later defaultValue syncs never bypass React's _valueTracker.
      writeWith(current, controlsChanged, controls);
    }
  }, [forceWrite, initial, read, readRaw, restore, writeWith]);

  useIsoLayoutEffect(sync);

  return {
    value: options.normalize?.(rawValue) ?? rawValue,
    defaultValue: initial,
    controlled,
    adopt: restore,
    read,
    propose: request,
    reconcile,
    repair,
    settleReset,
    sync,
  };
}

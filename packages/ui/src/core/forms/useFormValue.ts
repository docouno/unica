import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import { useStateAuthority } from '../useControllableState.js';
import type { ControllableStateOptions } from '../useControllableState.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { subscribeNativeReset } from './NativeResetWitness.js';
import type { FormControl, NativeResetSubscription } from './NativeResetWitness.js';

type FormValue = string | boolean | null | readonly string[];

interface FormValueOptions<T> extends ControllableStateOptions<T> {
  getControl: () => FormControl | null;
  write: (value: T) => void;
  readOnly?: boolean;
}

interface FormValueState<T> {
  value: T;
  propose: (next: T, source?: FormControl) => void;
}

export function useFormValue<T extends FormValue>(options: FormValueOptions<T>): FormValueState<T> {
  const [initial] = useState(() => structuredClone(options.defaultValue));
  const [value, { read, propose, restore }] = useStateAuthority({
    value: options.value,
    defaultValue: initial,
    onChange: options.onChange,
  });
  const config = useRef(options);
  const binding = useRef<(NativeResetSubscription & { control: FormControl }) | null>(null);
  const accepted = useRef(value);

  useInsertionEffect(() => {
    config.current = options;
  });

  const write = useCallback((next: T): void => {
    accepted.current = next;
    config.current.write(next);
  }, []);

  const commit = useCallback(
    (next: T): void => {
      if (!Object.is(accepted.current, next)) {
        binding.current?.noteCommit();
      }
      write(next);
    },
    [write],
  );

  const request = useCallback(
    (next: T, source?: FormControl): void => {
      const { getControl, readOnly } = config.current;
      const control = source ?? getControl();
      if (readOnly || control?.matches(':disabled')) {
        commit(read());
        return;
      }
      propose(next, commit);
    },
    [commit, propose, read],
  );

  useIsoLayoutEffect(() => {
    const { getControl } = config.current;
    const control = getControl();
    const previous = binding.current;
    if (!control) {
      previous?.unsubscribe();
      binding.current = null;
      return;
    }

    if (previous?.control !== control) {
      previous?.unsubscribe();
      const subscription = subscribeNativeReset(control, (result) => {
        if (result === 'reset') {
          restore(initial, write);
        } else {
          write(read());
        }
      });
      binding.current = { control, ...subscription };
    }
    commit(read());
  });

  useIsoLayoutEffect(
    () => () => {
      binding.current?.unsubscribe();
      binding.current = null;
    },
    [],
  );

  return { value, propose: request };
}

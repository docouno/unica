import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import { useStateAuthority } from '../useControllableState.js';
import type { ControllableStateOptions } from '../useControllableState.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { subscribeNativeReset } from './NativeResetWitness.js';

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
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
  const binding = useRef<{ control: FormControl; root: Node; unsubscribe: () => void } | null>(
    null,
  );

  useInsertionEffect(() => {
    config.current = options;
  });

  const writeAccepted = useCallback((next: T): void => {
    config.current.write(next);
  }, []);

  const request = useCallback(
    (next: T, source?: FormControl): void => {
      const { getControl, readOnly } = config.current;
      const control = source ?? getControl();
      if (readOnly || control?.matches(':disabled')) {
        writeAccepted(read());
        return;
      }
      propose(next, writeAccepted);
    },
    [propose, read, writeAccepted],
  );

  useIsoLayoutEffect(() => {
    const { getControl } = config.current;
    const control = getControl();
    const root = control?.getRootNode();
    const previous = binding.current;
    if (!control || !root) {
      previous?.unsubscribe();
      binding.current = null;
      return;
    }

    writeAccepted(read());
    if (previous?.control !== control || previous.root !== root) {
      previous?.unsubscribe();
      const unsubscribe = subscribeNativeReset(root, control, (result) => {
        if (result === 'reset') {
          restore(initial, writeAccepted);
        } else {
          writeAccepted(read());
        }
      });
      binding.current = { control, root, unsubscribe };
    }
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

import type { RefObject } from 'react';
import { writeSelectValue } from '../../src/core/forms/carriers.js';
import type { CarrierOption, SelectValue } from '../../src/core/forms/carriers.js';
import { useFormValue } from '../../src/core/forms/useFormValue.js';

interface FixtureSelectOptions<T> {
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  onReset?: (() => void) | undefined;
  catalog?: readonly CarrierOption[] | undefined;
  readOnly?: boolean | undefined;
}

interface FixtureSelect<T> {
  value: T;
  controlled: boolean;
  propose: (value: T) => void;
}

export function useFixtureSelect<T extends SelectValue>(
  ref: RefObject<HTMLSelectElement | null>,
  options: FixtureSelectOptions<T>,
): FixtureSelect<T> {
  const { value, controlled, propose } = useFormValue<T>({
    ...options,
    readOnly: options.readOnly ?? false,
    getControl: () => ref.current,
    writeDeps: [options.catalog],
    write: (next, context) => {
      if (ref.current) {
        writeSelectValue(ref.current, next, options.catalog ?? [], context);
      }
    },
  });
  return { value, controlled, propose };
}

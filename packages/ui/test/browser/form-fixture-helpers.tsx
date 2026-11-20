import type { RefObject } from 'react';
import { writeSelectValue } from '../../src/core/forms/carriers.js';
import type { CarrierOption } from '../../src/core/forms/carriers.js';
import { useFormValue } from '../../src/core/forms/useFormValue.js';

type SelectValue = string | null | readonly string[];

interface FixtureSelectOptions<T> {
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  catalog?: readonly CarrierOption[] | undefined;
  readOnly?: boolean | undefined;
}

interface FixtureSelect<T> {
  value: T;
  propose: (value: T) => void;
}

export function useFixtureSelect<T extends SelectValue>(
  ref: RefObject<HTMLSelectElement | null>,
  options: FixtureSelectOptions<T>,
): FixtureSelect<T> {
  const { value, propose } = useFormValue<T>({
    ...options,
    readOnly: options.readOnly ?? false,
    getControl: () => ref.current,
    write: (value) => {
      if (ref.current) {
        writeSelectValue(ref.current, value, options.catalog);
      }
    },
  });
  return { value, propose };
}

import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { writeRadioGroup, writeSelectValue } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import type { SegmentedControlOption, SegmentedControlProps } from './types.js';

type Selection = string | null;

interface SegmentedFormOptions extends Pick<
  SegmentedControlProps,
  'name' | 'form' | 'value' | 'defaultValue' | 'readOnly' | 'onValueChange'
> {
  readonly rail: RefObject<HTMLDivElement | null>;
  readonly catalog: ReadonlyMap<string, SegmentedControlOption>;
}

interface SelectionHistory {
  readonly current: Selection;
  readonly initial: Selection;
}

interface SegmentedForm {
  readonly carrier: RefObject<HTMLSelectElement | null>;
  readonly selected: Selection;
  readonly resetValue: Selection;
  readonly controlled: boolean;
  readonly choose: (input: HTMLInputElement) => void;
  readonly reconcile: () => void;
}

function known(
  key: Selection,
  catalog: ReadonlyMap<string, SegmentedControlOption>,
  retained: Selection,
): Selection {
  return key !== null && (catalog.has(key) || key === retained) ? key : null;
}

export function useSegmentedForm({
  rail,
  catalog,
  name,
  form,
  value,
  defaultValue,
  readOnly,
  onValueChange,
}: SegmentedFormOptions): SegmentedForm {
  const carrier = useRef<HTMLSelectElement>(null);
  const [initial] = useState(() =>
    defaultValue !== undefined
      ? defaultValue
      : ([...catalog.values()].find((option) => !option.disabled)?.value ?? null),
  );
  const [history, setHistory] = useState<SelectionHistory>({ current: null, initial: null });
  const initialKnown = known(initial, catalog, history.initial);

  const state = useFormValue<Selection>({
    value,
    defaultValue: initial,
    readOnly,
    getControl: () => carrier.current,
    writeDeps: [catalog, name, form],
    onChange: (next) => {
      if (next === null || next === value) {
        return;
      }
      if (value === undefined) {
        // The caller may remove this option in the same update.
        setHistory((previous) => ({ ...previous, current: next }));
      }
      onValueChange?.(next);
    },
    write: (next, { controlled, force }) => {
      const retained = !controlled && next === initial ? initialKnown : history.current;
      const selected = known(next, catalog, retained);
      const reset = controlled ? selected : initialKnown;
      const radios = Array.from(
        rail.current?.querySelectorAll<HTMLInputElement>('input[data-unica-segmented-option]') ??
          [],
      );
      writeRadioGroup(radios, selected, { force });
      for (const input of radios) {
        const defaultChecked = input.value === reset;
        if (input.defaultChecked !== defaultChecked) {
          input.defaultChecked = defaultChecked;
        }
      }
      if (carrier.current) {
        // Native radio preactivation can affect checkedness. Only the
        // committed snapshot is successful during form submission.
        writeSelectValue(carrier.current, selected, [], { controlled, defaultValue: reset });
      }
    },
  });

  const previousSelection =
    !state.controlled && state.value === initial ? initialKnown : history.current;
  const selected = known(state.value, catalog, previousSelection);
  // Record availability in the same render as the selection. Abandoned
  // renders cannot introduce a retained value or miss a just-seen default.
  if (selected !== history.current || initialKnown !== history.initial) {
    setHistory({ current: selected, initial: initialKnown });
  }
  const resetValue = state.controlled ? selected : initialKnown;
  const { propose, repair } = state;
  const choose = useCallback(
    (input: HTMLInputElement): void => propose(input.value, input),
    [propose],
  );

  return {
    carrier,
    selected,
    resetValue,
    controlled: state.controlled,
    choose,
    reconcile: repair,
  };
}

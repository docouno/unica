import { useState } from 'react';
import type { CSSProperties, ComponentPropsWithRef, FocusEvent, JSX } from 'react';

const hiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: 0,
  border: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  pointerEvents: 'none',
};

type FocusTarget = () => HTMLElement | null;

function delegateFocus(event: FocusEvent<HTMLElement>, getFocusTarget: FocusTarget): void {
  const carrier = event.currentTarget;
  queueMicrotask(() => {
    const root = carrier.getRootNode();
    // Let native validation finish registering its blur observer on the carrier.
    if ('activeElement' in root && root.activeElement === carrier) {
      const target = getFocusTarget();
      if (target && target !== carrier) {
        target.focus();
      }
    }
  });
}

type FormInputProps = Omit<ComponentPropsWithRef<'input'>, 'checked'> & {
  getFocusTarget?: FocusTarget;
};

export function FormInput({
  getFocusTarget,
  onFocus,
  style,
  defaultValue,
  defaultChecked,
  ...props
}: FormInputProps): JSX.Element {
  const [initial] = useState(() => ({ defaultValue, defaultChecked }));
  return (
    <input
      {...props}
      defaultValue={initial.defaultValue}
      defaultChecked={initial.defaultChecked}
      style={getFocusTarget ? { ...style, ...hiddenStyle } : style}
      {...(getFocusTarget && { 'aria-hidden': true, tabIndex: -1 })}
      onFocus={(event) => {
        if (getFocusTarget) {
          delegateFocus(event, getFocusTarget);
        }
        onFocus?.(event);
      }}
    />
  );
}

export function writeInputValue(input: HTMLInputElement, value: string): void {
  if (input.defaultValue !== value) {
    input.defaultValue = value;
  }
  if (input.value !== value) {
    input.value = value;
  }
}

export function writeInputChecked(input: HTMLInputElement, checked: boolean): void {
  if (input.defaultChecked !== checked) {
    input.defaultChecked = checked;
  }
  if (input.checked !== checked) {
    input.checked = checked;
  }
}

export function writeRadioGroup(
  radios: readonly HTMLInputElement[],
  selected: string | null,
): void {
  const checked = radios.find((radio) => radio.value === selected);
  for (const radio of radios) {
    if (radio !== checked) {
      writeInputChecked(radio, false);
    }
  }
  if (checked) {
    writeInputChecked(checked, true);
  }
}

type SelectValue = string | null | readonly string[];

export interface CarrierOption {
  value: string;
  label?: string;
  disabled?: boolean;
}

interface OptionRow {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
}

function optionRows(value: SelectValue, options: readonly CarrierOption[]): OptionRow[] {
  const selected = typeof value === 'string' ? [value] : (value ?? []);
  const catalog = new Map(options.map((option) => [option.value, option]));
  const ids = new Set([...selected, ...catalog.keys()]);
  const accepted = new Set(selected);
  const rows: OptionRow[] = [];

  for (const id of ids) {
    // When empty, the single select uses the disabled placeholder for its empty value.
    if (value === null && id === '') {
      continue;
    }
    const option = catalog.get(id);
    const selected = accepted.has(id);
    rows.push({
      value: id,
      label: option?.label ?? id,
      disabled: !selected && (option?.disabled ?? false),
      selected,
    });
  }
  return rows;
}

type FormSelectProps = Omit<
  ComponentPropsWithRef<'select'>,
  'children' | 'value' | 'defaultValue' | 'multiple' | 'onFocus'
> & {
  initialValue: SelectValue;
  options?: readonly CarrierOption[];
  getFocusTarget: FocusTarget;
};

export function FormSelect({
  initialValue,
  options = [],
  getFocusTarget,
  style,
  ...props
}: FormSelectProps): JSX.Element {
  // React renders the initial options for SSR. Subsequent option writes belong to
  // the native carrier, including synchronous writes during a value proposal.
  const [initial] = useState(() => ({
    value: initialValue ?? '',
    children: (
      <>
        {initialValue === null && <option value="" disabled />}
        <optgroup label="">
          {optionRows(initialValue, options).map(({ value, label, disabled }) => (
            <option key={value} value={value} disabled={disabled}>
              {label}
            </option>
          ))}
        </optgroup>
      </>
    ),
  }));

  return (
    <select
      {...props}
      defaultValue={initial.value}
      multiple={typeof initial.value !== 'string'}
      tabIndex={-1}
      aria-hidden="true"
      style={{ ...style, ...hiddenStyle }}
      onFocus={(event) => delegateFocus(event, getFocusTarget)}
    >
      {initial.children}
    </select>
  );
}

export function writeSelectValue(
  select: HTMLSelectElement,
  value: SelectValue,
  options: readonly CarrierOption[] = [],
): void {
  const rows = optionRows(value, options);
  const hasPlaceholder = value === null;
  const expected = hasPlaceholder
    ? [{ value: '', label: '', disabled: true, selected: true }, ...rows]
    : rows;
  const existing = Array.from(select.options);

  if (
    existing.length !== expected.length ||
    expected.some((row, index) => {
      const option = existing[index];
      return (
        !option ||
        option.value !== row.value ||
        option.textContent !== row.label ||
        option.disabled !== row.disabled ||
        (option.parentElement === select) !== (hasPlaceholder && index === 0)
      );
    })
  ) {
    const createOption = ({ value, label, disabled }: OptionRow): HTMLOptionElement => {
      const option = select.ownerDocument.createElement('option');
      option.value = value;
      option.text = label;
      option.disabled = disabled;
      return option;
    };
    const group = select.ownerDocument.createElement('optgroup');
    group.label = '';
    for (const row of rows) {
      group.append(createOption(row));
    }
    select.replaceChildren(...(hasPlaceholder ? [createOption(expected[0]!), group] : [group]));
  }

  for (const [index, row] of expected.entries()) {
    const option = select.options[index]!;
    if (option.defaultSelected !== row.selected) {
      option.defaultSelected = row.selected;
    }
    if (select.multiple && option.selected !== row.selected) {
      option.selected = row.selected;
    }
  }
  if (!select.multiple) {
    const index = expected.findIndex(({ selected }) => selected);
    if (select.selectedIndex !== index) {
      select.selectedIndex = index;
    }
  }
}

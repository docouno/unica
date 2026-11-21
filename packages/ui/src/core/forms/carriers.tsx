import { useState } from 'react';
import type { ComponentPropsWithRef, FocusEvent, JSX } from 'react';
import {
  createElementSafe,
  getOwnerDocument,
  getRootActiveElement,
  getRootNodeSafe,
} from '../dom.js';

const hiddenClass = 'unica-visually-hidden';

function joinClassName(className: string | undefined, extra: string): string {
  return className ? `${className} ${extra}` : extra;
}

type FocusTarget = () => HTMLElement | null;

function delegateFocus(event: FocusEvent<HTMLElement>, getFocusTarget: FocusTarget): void {
  const carrier = event.currentTarget;
  queueMicrotask(() => {
    const doc = getOwnerDocument(carrier);
    if (!doc) {
      return;
    }
    const root = getRootNodeSafe(carrier);
    // Let native validation finish registering its blur observer on the carrier.
    if (getRootActiveElement(root, doc) === carrier) {
      const target = getFocusTarget();
      if (target && target !== carrier) {
        target.focus();
      }
    }
  });
}

export interface CarrierWriteOptions {
  readonly syncDefault?: boolean | undefined;
  readonly force?: boolean | undefined;
}

export type FormInputProps = Omit<ComponentPropsWithRef<'input'>, 'checked'> & {
  readonly controlled: boolean;
  readonly getFocusTarget?: FocusTarget | undefined;
};

export function FormInput({
  controlled,
  getFocusTarget,
  className,
  onFocus,
  defaultValue,
  defaultChecked,
  ...props
}: FormInputProps): JSX.Element {
  const [initial] = useState(() => ({ defaultValue, defaultChecked }));
  return (
    <input
      {...props}
      className={getFocusTarget ? joinClassName(className, hiddenClass) : className}
      defaultValue={controlled ? defaultValue : initial.defaultValue}
      defaultChecked={controlled ? defaultChecked : initial.defaultChecked}
      {...(getFocusTarget && { 'aria-hidden': true, tabIndex: -1 })}
      onFocus={
        getFocusTarget
          ? (event) => {
              delegateFocus(event, getFocusTarget);
              onFocus?.(event);
            }
          : onFocus
      }
    />
  );
}

export type FormTextareaProps = Omit<ComponentPropsWithRef<'textarea'>, 'value'> & {
  readonly controlled: boolean;
  readonly getFocusTarget?: FocusTarget | undefined;
};

export function FormTextarea({
  controlled,
  getFocusTarget,
  className,
  onFocus,
  defaultValue,
  ...props
}: FormTextareaProps): JSX.Element {
  const [initial] = useState(() => ({ defaultValue }));
  return (
    <textarea
      {...props}
      className={getFocusTarget ? joinClassName(className, hiddenClass) : className}
      defaultValue={controlled ? defaultValue : initial.defaultValue}
      {...(getFocusTarget && { 'aria-hidden': true, tabIndex: -1 })}
      onFocus={
        getFocusTarget
          ? (event) => {
              delegateFocus(event, getFocusTarget);
              onFocus?.(event);
            }
          : onFocus
      }
    />
  );
}

export function writeInputValue(
  input: HTMLInputElement,
  value: string,
  options?: CarrierWriteOptions,
): void {
  // Write value before defaultValue so a false dirty-value flag never lets defaultValue
  // update input.value silently and bypass React's _valueTracker setter.
  if (options?.force || input.value !== value) {
    input.value = value;
  }
  if (options?.syncDefault && input.defaultValue !== value) {
    input.defaultValue = value;
  }
}

export function writeTextareaValue(
  textarea: HTMLTextAreaElement,
  value: string,
  options?: CarrierWriteOptions,
): void {
  if (options?.force || textarea.value !== value) {
    textarea.value = value;
  }
  if (options?.syncDefault && textarea.defaultValue !== value) {
    textarea.defaultValue = value;
  }
}

export function writeInputChecked(
  input: HTMLInputElement,
  checked: boolean,
  options?: CarrierWriteOptions,
): void {
  if (options?.force || input.checked !== checked) {
    input.checked = checked;
  }
  if (options?.syncDefault && input.defaultChecked !== checked) {
    input.defaultChecked = checked;
  }
}

export function writeRadioGroup(
  radios: readonly HTMLInputElement[],
  selected: string | null,
  options?: CarrierWriteOptions,
): void {
  const checked = radios.find((radio) => radio.value === selected);
  // Always run the JS setter on unselected peers so native radio-group unchecking
  // never leaves a stale React _valueTracker on previously checked siblings.
  const uncheckedOptions: CarrierWriteOptions = {
    syncDefault: options?.syncDefault,
    force: true,
  };
  for (const radio of radios) {
    if (radio !== checked) {
      writeInputChecked(radio, false, uncheckedOptions);
    }
  }
  if (checked) {
    writeInputChecked(checked, true, options);
  }
}

export type SelectValue = string | null | readonly string[];

export interface CarrierOption {
  readonly value: string;
  readonly label?: string | undefined;
  readonly disabled?: boolean | undefined;
}

export interface SelectWriteContext {
  readonly controlled: boolean;
  readonly defaultValue: SelectValue;
}

interface OptionRow {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  defaultSelected: boolean;
}

function toValueList(value: SelectValue | undefined): readonly string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return typeof value === 'string' ? [value] : value;
}

/**
 * Option values are deduplicated as a set of distinct option keys.
 * Single selects keep catalog order so selection changes never rebuild DOM nodes.
 * Multi selects place committed entries first so FormData preserves committed order.
 */
function optionRows(
  value: SelectValue,
  options: readonly CarrierOption[],
  multiple: boolean,
  defaultValue: SelectValue,
): OptionRow[] {
  const selectedList = toValueList(value);
  const defaultList = toValueList(defaultValue);
  const selectedSet = new Set(selectedList);
  const defaultSet = new Set(defaultList);
  const catalog = new Map<string, CarrierOption>();
  for (const option of options) {
    if (!catalog.has(option.value)) {
      catalog.set(option.value, option);
    }
  }

  const ids = new Set<string>();
  if (multiple) {
    for (const id of selectedList) {
      ids.add(id);
    }
    for (const id of defaultList) {
      ids.add(id);
    }
    for (const id of catalog.keys()) {
      ids.add(id);
    }
  } else {
    for (const id of catalog.keys()) {
      ids.add(id);
    }
    for (const id of selectedList) {
      ids.add(id);
    }
    for (const id of defaultList) {
      ids.add(id);
    }
  }

  const rows: OptionRow[] = [];
  for (const id of ids) {
    // When empty on both current and default, the disabled placeholder represents null.
    if (!multiple && value === null && defaultValue === null && id === '') {
      continue;
    }
    const option = catalog.get(id);
    const selected = selectedSet.has(id);
    const defaultSelected = defaultSet.has(id);
    rows.push({
      value: id,
      label: option?.label ?? id,
      disabled: !selected && !defaultSelected && (option?.disabled ?? false),
      selected,
      defaultSelected,
    });
  }
  return rows;
}

export type FormSelectProps = Omit<
  ComponentPropsWithRef<'select'>,
  'children' | 'value' | 'defaultValue' | 'onFocus'
> & {
  /** Mount/SSR snapshot value. Subsequent updates are written via writeSelectValue. */
  readonly initialValue: SelectValue;
  /** Mount/SSR snapshot catalog. Reactive catalog updates pass through writeSelectValue + writeDeps. */
  readonly initialOptions?: readonly CarrierOption[] | undefined;
  readonly getFocusTarget: FocusTarget;
};

export function FormSelect({
  initialValue,
  multiple,
  initialOptions = [],
  getFocusTarget,
  className,
  ...props
}: FormSelectProps): JSX.Element {
  // React renders the initial options for SSR. Subsequent writes update the existing
  // optgroup in place so hydration keeps DOM node identity.
  const [initial] = useState(() => {
    const isMultiple = multiple ?? Array.isArray(initialValue);
    const hasPlaceholder = !isMultiple && initialValue === null;
    const rows = optionRows(initialValue, initialOptions, isMultiple, initialValue);
    return {
      multiple: isMultiple,
      value: isMultiple ? toValueList(initialValue) : (initialValue ?? ''),
      children: (
        <>
          {hasPlaceholder && <option value="" disabled />}
          <optgroup label="">
            {rows.map(({ value, label, disabled }) => (
              <option key={value} value={value} disabled={disabled}>
                {label}
              </option>
            ))}
          </optgroup>
        </>
      ),
    };
  });

  return (
    <select
      {...props}
      className={joinClassName(className, hiddenClass)}
      defaultValue={initial.value}
      multiple={initial.multiple}
      tabIndex={-1}
      aria-hidden="true"
      onFocus={(event) => delegateFocus(event, getFocusTarget)}
    >
      {initial.children}
    </select>
  );
}

export function writeSelectValue(
  select: HTMLSelectElement,
  value: SelectValue,
  options: readonly CarrierOption[],
  context: SelectWriteContext,
): void {
  const multiple = select.multiple;
  const defaultValue = context.controlled ? value : context.defaultValue;
  const rows = optionRows(value, options, multiple, defaultValue);
  const needPlaceholder = !multiple && (value === null || defaultValue === null);
  const doc = getOwnerDocument(select) ?? select.ownerDocument;

  let placeholder: HTMLOptionElement | null = null;
  let group: HTMLOptGroupElement | null = null;
  for (let child = select.firstElementChild; child; child = child.nextElementSibling) {
    if (!placeholder && child.localName === 'option') {
      placeholder = child as HTMLOptionElement;
    } else if (!group && child.localName === 'optgroup') {
      group = child as HTMLOptGroupElement;
    }
  }

  if (needPlaceholder) {
    if (!placeholder) {
      placeholder = createElementSafe(doc, 'option');
      placeholder.value = '';
      placeholder.disabled = true;
      select.prepend(placeholder);
    } else {
      if (placeholder.value !== '') {
        placeholder.value = '';
      }
      if (!placeholder.disabled) {
        placeholder.disabled = true;
      }
      if (select.firstElementChild !== placeholder) {
        select.prepend(placeholder);
      }
    }
  } else if (placeholder) {
    placeholder.remove();
    placeholder = null;
  }

  if (!group) {
    group = createElementSafe(doc, 'optgroup');
    group.label = '';
    select.append(group);
  }

  const nextValues = new Set<string>();
  for (const row of rows) {
    nextValues.add(row.value);
  }

  // Prune removed or duplicate children before placing rows so removing a leading option
  // never causes O(N) insertBefore churn across all subsequent options.
  const existingByValue = new Map<string, HTMLOptionElement>();
  const stale: Element[] = [];
  for (let child = group.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === 'option') {
      const opt = child as HTMLOptionElement;
      if (nextValues.has(opt.value) && !existingByValue.has(opt.value)) {
        existingByValue.set(opt.value, opt);
        continue;
      }
    }
    stale.push(child);
  }
  for (const node of stale) {
    node.remove();
  }

  let cursor: Element | null = group.firstElementChild;
  for (const row of rows) {
    let opt = existingByValue.get(row.value);
    if (!opt) {
      opt = createElementSafe(doc, 'option');
      opt.value = row.value;
      opt.text = row.label;
      opt.disabled = row.disabled;
    } else {
      if (opt.text !== row.label) {
        opt.text = row.label;
      }
      if (opt.disabled !== row.disabled) {
        opt.disabled = row.disabled;
      }
    }
    if (cursor === opt) {
      cursor = cursor.nextElementSibling;
    } else {
      group.insertBefore(opt, cursor);
    }
  }

  if (placeholder) {
    const placeholderDefault = defaultValue === null;
    if (placeholder.defaultSelected !== placeholderDefault) {
      placeholder.defaultSelected = placeholderDefault;
    }
  }

  let optCursor = group.firstElementChild as HTMLOptionElement | null;
  for (const row of rows) {
    if (!optCursor) {
      break;
    }
    if (optCursor.defaultSelected !== row.defaultSelected) {
      optCursor.defaultSelected = row.defaultSelected;
    }
    if (multiple && optCursor.selected !== row.selected) {
      optCursor.selected = row.selected;
    }
    optCursor = optCursor.nextElementSibling as HTMLOptionElement | null;
  }

  if (!multiple) {
    const selectedIndex =
      value === null ? 0 : (placeholder ? 1 : 0) + rows.findIndex((row) => row.selected);
    if (select.selectedIndex !== selectedIndex) {
      select.selectedIndex = selectedIndex;
    }
  }
}

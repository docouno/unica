import { useCallback, useRef, useState } from 'react';
import type { JSX } from 'react';
import {
  getDefaultView,
  getShadowHostSafe,
  isElementNode,
  isInertElement,
  matchesSafe,
  parentNodeOf,
} from '../../core/dom.js';
import { FormSelect, writeSelectValue } from '../../core/forms/carriers.js';
import type { SelectValue } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { warnOnce } from '../../core/devWarning.js';
import type { Catalog, CollectionEntry, Row } from './collection.js';
import { defaultPickerMessages } from './messages.js';
import type { PickerMessages, PickerProps, PickerValueProps } from './types.js';

interface SelectionOptions {
  readonly catalog: Catalog;
  readonly props: PickerProps & PickerValueProps;
  readonly getFocusTarget: () => HTMLElement | null;
  readonly busy?: boolean | undefined;
  readonly failed?: boolean | undefined;
  readonly onReset?: (() => void) | undefined;
}

interface LabelHistory {
  readonly catalog: Catalog | undefined;
  readonly labels: ReadonlyMap<string, string>;
}

export interface PickerSelection {
  readonly multiple: boolean;
  readonly selected: ReadonlySet<string>;
  readonly labels: readonly string[];
  readonly entries: readonly CollectionEntry[];
  readonly messages: PickerMessages;
  readonly disabled: boolean;
  readonly carrier: JSX.Element;
  readonly isUnavailable: (host: HTMLElement) => boolean;
  readonly choose: (row: Row, host: HTMLElement) => boolean;
  readonly clear: (host: HTMLElement) => boolean;
}

const selectionProps = [
  'value',
  'defaultValue',
  'multiple',
  'onValueChange',
  'name',
  'form',
  'messages',
  'selectedLabels',
  'disabled',
] as const;

export function omitSelectionProps<T extends object>(
  attributes: T,
): Omit<T, (typeof selectionProps)[number]> {
  for (const name of selectionProps) {
    Reflect.deleteProperty(attributes, name);
  }
  return attributes;
}

const emptyValues: readonly string[] = [];

function valueKeys(value: SelectValue): readonly string[] {
  return value === null ? emptyValues : typeof value === 'string' ? [value] : value;
}

function normalize(value: SelectValue, multiple: boolean): SelectValue {
  const keys = valueKeys(value);
  return multiple ? Array.from(new Set(keys)) : (keys[0] ?? null);
}

function observeDisabled(
  control: HTMLSelectElement,
  setDisabled: (disabled: boolean) => void,
): () => void {
  const view = getDefaultView(control.ownerDocument);
  let path: Node[] = [];
  const observer = view ? new view.MutationObserver(sync) : undefined;
  function sync(): void {
    setDisabled(matchesSafe(control, ':disabled'));
    const next: Node[] = [];
    for (
      let node: Node | null = control;
      node;
      node = parentNodeOf(node) ?? getShadowHostSafe(node)
    ) {
      next.push(node);
    }
    if (next.length === path.length && next.every((node, index) => node === path[index])) {
      return;
    }
    path = next;
    observer?.disconnect();
    for (const node of path) {
      observer?.observe(node, {
        childList: true,
        ...(node === control || (isElementNode(node) && node.localName === 'fieldset')
          ? { attributes: true, attributeFilter: ['disabled'] }
          : undefined),
      });
    }
  }
  sync();
  return () => observer?.disconnect();
}

export function usePickerSelection({
  catalog,
  props,
  getFocusTarget,
  busy,
  failed,
  onReset,
}: SelectionOptions): PickerSelection {
  const { name, form, disabled, readOnly, required, selectedLabels, messages: overrides } = props;
  const multiple = props.multiple === true;
  const [originalMultiple] = useState(multiple);
  if (originalMultiple !== multiple) {
    warnOnce('picker-multiple-change', 'Remount the picker with a new key when changing multiple.');
  }
  const messages = { ...defaultPickerMessages, ...overrides };
  const control = useRef<HTMLSelectElement | null>(null);
  const [nativeDisabled, setNativeDisabled] = useState(false);
  const attach = useCallback((node: HTMLSelectElement | null) => {
    if (!node) {
      return;
    }
    control.current = node;
    const stop = observeDisabled(node, setNativeDisabled);
    return () => {
      stop();
      control.current = null;
    };
  }, []);
  const state = useFormValue<SelectValue>({
    value: props.value,
    defaultValue: props.defaultValue ?? (multiple ? emptyValues : null),
    normalize: (value) => normalize(value, multiple),
    getControl: () => control.current,
    readOnly,
    writeDeps: [multiple, name, form],
    onReset,
    onChange: (next) => {
      if (props.multiple) {
        props.onValueChange?.(valueKeys(next));
      } else {
        props.onValueChange?.(valueKeys(next)[0] ?? null);
      }
    },
    write: (value, context) => {
      if (control.current) {
        // Only successful values and mount defaults need rows in the native carrier.
        writeSelectValue(control.current, value, [], {
          controlled: context.controlled,
          defaultValue: normalize(context.defaultValue, multiple),
        });
      }
    },
  });
  const [history, setHistory] = useState<LabelHistory>(() => ({
    catalog: undefined,
    labels: new Map(),
  }));
  const keys = valueKeys(state.value);
  const confirmedCatalog = busy || failed ? history.catalog : catalog;
  const remembered = new Map<string, string>();
  for (const key of [...keys, ...valueKeys(state.defaultValue)]) {
    // A controlled owner may accept a key and replace the catalog in one commit.
    // Keep the previous successful catalog available for that transition, then
    // retain names only for committed and default keys.
    const label =
      confirmedCatalog?.byValue.get(key)?.label ??
      history.labels.get(key) ??
      history.catalog?.byValue.get(key)?.label;
    if (label !== undefined) {
      remembered.set(key, label);
    }
  }
  if (
    confirmedCatalog !== history.catalog ||
    remembered.size !== history.labels.size ||
    [...remembered].some(([key, label]) => history.labels.get(key) !== label)
  ) {
    setHistory({ catalog: confirmedCatalog, labels: remembered });
  }
  const labelFor = (key: string): string =>
    catalog.byValue.get(key)?.label ??
    remembered.get(key) ??
    (selectedLabels && Object.hasOwn(selectedLabels, key) ? selectedLabels[key] : undefined) ??
    messages.unavailableOption;

  const unavailable = Boolean(disabled || nativeDisabled);
  const isUnavailable = (host: HTMLElement): boolean =>
    Boolean(
      disabled ||
      (control.current && matchesSafe(control.current, ':disabled')) ||
      isInertElement(host),
    );
  const canChange = (host: HTMLElement): boolean =>
    !isUnavailable(host) && !readOnly && !busy && !failed;
  function choose(row: Row, host: HTMLElement): boolean {
    if (row.disabled || !canChange(host)) {
      return false;
    }
    state.settleReset();
    const current = valueKeys(state.read());
    if (row.unavailable && !current.includes(row.value)) {
      return false;
    }
    if (multiple) {
      state.propose(
        current.includes(row.value)
          ? current.filter((key) => key !== row.value)
          : [...current, row.value],
      );
    } else {
      const next = row.unavailable ? null : row.value;
      if (next !== state.read()) {
        state.propose(next);
      }
    }
    return true;
  }
  function clear(host: HTMLElement): boolean {
    if (!canChange(host)) {
      return false;
    }
    state.settleReset();
    if (valueKeys(state.read()).length > 0) {
      state.propose(multiple ? emptyValues : null);
    }
    return true;
  }

  const missing: Row[] =
    busy || failed
      ? []
      : keys
          .filter((key) => !catalog.byValue.has(key))
          .map((value) => ({
            value,
            label: labelFor(value),
            description: readOnly ? messages.unavailableDescription : messages.removeUnavailable,
            unavailable: true,
            disabled: readOnly,
          }));
  const entries = missing.length
    ? [
        ...catalog.entries,
        { label: messages.unavailableGroup, options: missing, key: 'unavailable' },
      ]
    : catalog.entries;
  return {
    multiple,
    selected: new Set(keys),
    labels: keys.map(labelFor),
    entries,
    messages,
    disabled: unavailable,
    isUnavailable,
    choose,
    clear,
    carrier: (
      <FormSelect
        key={multiple ? 'multiple' : 'single'}
        ref={attach}
        name={name}
        form={form}
        disabled={disabled}
        required={!readOnly && required}
        multiple={multiple}
        initialValue={state.value}
        getFocusTarget={() => {
          const host = getFocusTarget();
          return host && !isUnavailable(host) ? host : null;
        }}
        onChange={state.repair}
      />
    ),
  };
}

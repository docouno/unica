import { createContext, useCallback, useId, useInsertionEffect, useRef, useState } from 'react';
import type { Context, JSX } from 'react';
import { cx } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { writeInputChecked, writeRadioGroup } from '../../core/forms/carriers.js';
import type { FormWriteContext } from '../../core/forms/useFormValue.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { createBinaryGroupDom } from './group-dom.js';
import type { BinaryGroupDom } from './group-dom.js';
import type {
  BinaryGroupProps,
  BinaryKind,
  BinarySize,
  BinaryStatus,
  ToggleGroupProps,
} from './types.js';
import './binary.css';

const emptyKeys: readonly string[] = [];
const keyAttribute = 'data-unica-binary-keyed';

export interface BinaryGroupContext {
  readonly dom: BinaryGroupDom;
  readonly managed: boolean;
  readonly controlled: boolean;
  readonly sharedOwner: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly name: string | undefined;
  readonly form: string | undefined;
  readonly size: BinarySize | undefined;
  readonly status: BinaryStatus | undefined;
  readonly isChecked: (key: string | undefined) => boolean;
  readonly isDefaultChecked: (key: string | undefined) => boolean;
  readonly propose: (input: HTMLInputElement, next: boolean) => boolean;
  readonly repair: () => void;
}

export const CheckboxContext: Context<BinaryGroupContext | null> =
  createContext<BinaryGroupContext | null>(null);
export const RadioContext: Context<BinaryGroupContext | null> =
  createContext<BinaryGroupContext | null>(null);
export const SwitchContext: Context<BinaryGroupContext | null> =
  createContext<BinaryGroupContext | null>(null);

type GroupValue = string | null | readonly string[];

interface GroupOptions<T extends GroupValue> {
  readonly kind: BinaryKind;
  readonly managed: boolean;
  readonly value: T | undefined;
  readonly defaultValue: T;
  readonly onValueChange: ((next: T) => void) | undefined;
  readonly isSelected: (value: T, key: string) => boolean;
  readonly select: (current: T, key: string, checked: boolean) => T | undefined;
  readonly required?: boolean | undefined;
  readonly requiredMessage?: string | undefined;
  readonly status?: BinaryStatus | undefined;
}

function writeGroup(
  kind: BinaryKind,
  dom: BinaryGroupDom,
  value: GroupValue,
  { controlled, defaultValue, force }: FormWriteContext<GroupValue>,
): void {
  const controls = dom.getControls();
  const matching = controls.filter((input) => input.hasAttribute(keyAttribute));
  const defaults = controlled ? value : defaultValue;
  if (kind === 'radio') {
    for (const input of controls) {
      if (!input.hasAttribute(keyAttribute)) {
        writeInputChecked(input, false, { force: true, syncDefault: true });
      }
    }
    writeRadioGroup(matching, value as string | null, { force });
    const defaultInput = matching.find((input) => input.value === defaults);
    for (const input of matching) {
      if (input.defaultChecked !== (input === defaultInput)) {
        input.defaultChecked = input === defaultInput;
      }
    }
  } else {
    const checkedKeys = new Set(value as readonly string[]);
    const defaultKeys = new Set(defaults as readonly string[]);
    for (const input of controls) {
      const keyed = input.hasAttribute(keyAttribute);
      const checked = keyed && checkedKeys.has(input.value);
      const defaultChecked = keyed && defaultKeys.has(input.value);
      writeInputChecked(input, checked, { force });
      if (input.defaultChecked !== defaultChecked) {
        input.defaultChecked = defaultChecked;
      }
      if (kind === 'checkbox') {
        input.indeterminate = input.hasAttribute('data-unica-binary-mixed');
      }
    }
  }
  dom.syncValidity();
}

function useBinaryGroup<T extends GroupValue>(
  props: BinaryGroupProps,
  options: GroupOptions<T>,
): { context: BinaryGroupContext; rootProps: BinaryGroupProps } {
  const {
    kind,
    managed,
    value,
    defaultValue,
    onValueChange,
    isSelected,
    select,
    required = false,
    requiredMessage,
    status,
  } = options;
  const {
    ref,
    name: nameProp,
    form,
    size,
    disabled = false,
    readOnly = false,
    orientation = 'vertical',
    className,
    ...attrs
  } = props;
  const generated = useId();
  const isRadio = kind === 'radio';
  const name = isRadio ? nameProp || generated : nameProp;
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useCallback(
    (element: HTMLDivElement | null) => mergeRefs(root, ref)(element),
    [ref],
  );
  const [dom] = useState(createBinaryGroupDom);
  const sharedOwner = managed || required;

  useInsertionEffect(() => dom.prepare({ form, sharedOwner, keyed: managed }));

  const state = useFormValue<T>({
    value,
    defaultValue,
    onChange: onValueChange,
    readOnly,
    getControls: () => (managed ? dom.getControls() : []),
    write: (next, config) => writeGroup(kind, dom, next, config),
  });

  useIsoLayoutEffect(() => () => dom.disconnect(), [dom]);
  useIsoLayoutEffect(() => {
    if (root.current) {
      dom.configure({
        root: root.current,
        kind,
        sharedOwner,
        keyed: managed,
        form,
        tabIndex: attrs.tabIndex,
        required,
        requiredMessage,
        onMembersChange: () => {
          if (managed) {
            state.sync();
            // A registered control may have changed keys without changing node identity.
            state.repair();
          }
        },
        onRadioSetChange: () => {
          const controls = dom.getControls();
          const value = state.read();
          const selected = controls.find(
            (input) => input.hasAttribute(keyAttribute) && input.value === value,
          );
          if (controls.some((input) => input.checked !== (input === selected))) {
            state.repair();
          }
        },
      });
      state.sync();
    }
  });

  const context: BinaryGroupContext = {
    dom,
    managed,
    controlled: state.controlled,
    sharedOwner,
    disabled,
    readOnly,
    name,
    form,
    size,
    status,
    required,
    isChecked: (key) => key !== undefined && isSelected(state.value, key),
    isDefaultChecked: (key) => {
      const defaults = state.controlled ? state.value : state.defaultValue;
      return key !== undefined && isSelected(defaults, key);
    },
    propose(input, checked) {
      const key = input.hasAttribute(keyAttribute) ? input.value : undefined;
      dom.sync();
      if (readOnly || key === undefined || !dom.getControls().includes(input)) {
        state.repair();
        return false;
      }
      const next = select(state.read(), key, checked);
      if (next === undefined) {
        state.repair();
        return false;
      }
      state.propose(next, input);
      return true;
    },
    repair: state.repair,
  };

  return {
    context,
    rootProps: {
      ...attrs,
      ref: rootRef,
      className: cx('unica-binary-group', className),
      'data-unica-binary-orientation': orientation,
      'aria-disabled': disabled || attrs['aria-disabled'],
      'aria-invalid': disabled ? undefined : status === 'danger' || attrs['aria-invalid'],
      ...(isRadio && {
        'aria-readonly': readOnly || attrs['aria-readonly'],
        'aria-required': required || attrs['aria-required'],
      }),
    },
  };
}

type BinaryToggleGroupProps = ToggleGroupProps & {
  readonly kind: 'checkbox' | 'switch';
  readonly required?: boolean | undefined;
  readonly requiredMessage?: string | undefined;
  readonly status?: BinaryStatus | undefined;
};

export function BinaryToggleGroup({
  kind,
  value,
  defaultValue,
  onValueChange,
  required,
  requiredMessage,
  status,
  ...props
}: BinaryToggleGroupProps): JSX.Element {
  const Provider = kind === 'checkbox' ? CheckboxContext : SwitchContext;
  const { context, rootProps } = useBinaryGroup<readonly string[]>(props, {
    kind,
    managed: value !== undefined || defaultValue !== undefined || onValueChange !== undefined,
    value,
    defaultValue: defaultValue ?? emptyKeys,
    onValueChange: onValueChange && ((next) => onValueChange([...next])),
    isSelected: (keys, key) => keys.includes(key),
    select: (keys, key, checked) => {
      if (keys.includes(key) === checked) {
        return undefined;
      }
      return checked ? [...keys, key] : keys.filter((entry) => entry !== key);
    },
    required,
    requiredMessage,
    status,
  });
  return (
    <Provider value={context}>
      <div {...rootProps} role="group" />
    </Provider>
  );
}

interface BinaryRadioGroupProps extends BinaryGroupProps {
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((next: string) => void) | undefined;
  readonly required?: boolean | undefined;
  readonly status?: BinaryStatus | undefined;
}

export function BinaryRadioGroup({
  value,
  defaultValue = null,
  onValueChange,
  required,
  status,
  ...props
}: BinaryRadioGroupProps): JSX.Element {
  const { context, rootProps } = useBinaryGroup<string | null>(props, {
    kind: 'radio',
    managed: true,
    value,
    defaultValue,
    isSelected: (current, key) => current === key,
    select: (current, key, checked) => (checked && current !== key ? key : undefined),
    onValueChange:
      onValueChange &&
      ((next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }),
    required,
    status,
  });
  return (
    <RadioContext value={context}>
      <div {...rootProps} role="radiogroup" />
    </RadioContext>
  );
}

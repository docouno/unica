import { useId, useInsertionEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { completeKeydown } from '../../core/activation.js';
import { navigateCollection } from '../../core/collections/navigation.js';
import { cx } from '../../core/cx.js';
import { descriptionIds } from '../../core/description.js';
import { isRTL, matchesSafe } from '../../core/dom.js';
import { FormInput, writeInputChecked, writeRadioGroup } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { ChipControl } from './Chip.js';
import {
  chipInputs,
  createChipGroupDom,
  isChipAvailable,
  observeChipAvailability,
} from './group-dom.js';
import type { ChipGroupProps } from './types.js';
import './chip.css';

type Selection = string | null | readonly string[];
const empty: readonly string[] = [];
const radioKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

function selected(value: Selection, key: string): boolean {
  return typeof value === 'string' || value === null ? value === key : value.includes(key);
}

function normalized(value: Selection): Selection {
  return typeof value === 'string' || value === null ? value : Array.from(new Set(value));
}

function present(content: ReactNode): boolean {
  return content !== undefined && content !== null && content !== false && content !== '';
}

/** Group compact radio or checkbox options under one label and form value. */
export function ChipGroup(props: ChipGroupProps): ReactElement {
  const {
    ref,
    items,
    multiple = false,
    disabled = false,
    form,
    name,
    required = false,
    size = 'm',
    label,
    description,
    message,
    status,
    value,
    defaultValue,
    onValueChange,
    className,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    'data-preview': preview,
    ...attrs
  } = props;
  void preview;
  const id = useId();
  const descriptionId = present(description) ? `${id}-description` : undefined;
  const messageId = present(message) ? `${id}-message` : undefined;
  const descriptions = [
    ...new Set([...descriptionIds(describedBy), descriptionId, messageId].filter(Boolean)),
  ];
  const group = useRef<HTMLFieldSetElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const witness = useRef<HTMLInputElement>(null);
  const rootRef = useMemo(() => mergeRefs(group, ref), [ref]);
  const [dom] = useState(createChipGroupDom);
  const invalid = status === 'danger' || ariaInvalid;
  const state = useFormValue<Selection>({
    value,
    defaultValue: defaultValue ?? (multiple ? empty : null),
    normalize: normalized,
    onChange:
      onValueChange &&
      ((next) => {
        if (props.multiple) {
          if (next !== null && typeof next !== 'string') {
            props.onValueChange?.(next);
          }
        } else if (typeof next === 'string') {
          props.onValueChange?.(next);
        }
      }),
    getControls: () => [witness.current, ...chipInputs(options.current)],
    writeDeps: [required, disabled, name, form, multiple],
    write(next, { defaultValue: initial, controlled, force }) {
      const controls = chipInputs(options.current);
      const defaults = controlled ? next : initial;
      if (!multiple) {
        writeRadioGroup(controls, typeof next === 'string' ? next : null, { force });
      } else {
        for (const input of controls) {
          writeInputChecked(input, selected(next, input.value), { force });
        }
      }
      for (const input of controls) {
        const defaultChecked = selected(defaults, input.value);
        if (input.defaultChecked !== defaultChecked) {
          input.defaultChecked = defaultChecked;
        }
      }
      syncValidity(controls, defaults);
      syncFocus(controls);
    },
  });
  const defaults = state.controlled ? state.value : state.defaultValue;

  function syncValidity(controls: readonly HTMLInputElement[], initial: Selection): void {
    if (!witness.current) {
      return;
    }
    // The fieldset already bars both the options and witness from validation.
    // Preserve the witness's constraint and reset baseline across re-enabling it.
    const eligible = controls.filter((input) => !input.disabled);
    witness.current.required = required && eligible.length > 0;
    writeInputChecked(
      witness.current,
      eligible.some((input) => input.checked),
    );
    const defaultChecked = eligible.some((input) => selected(initial, input.value));
    if (witness.current.defaultChecked !== defaultChecked) {
      witness.current.defaultChecked = defaultChecked;
    }
    if (group.current) {
      if (invalid === undefined || matchesSafe(group.current, ':disabled')) {
        group.current.removeAttribute('aria-invalid');
      } else if (group.current.getAttribute('aria-invalid') !== String(invalid)) {
        group.current.setAttribute('aria-invalid', String(invalid));
      }
    }
  }

  function syncFocus(controls: readonly HTMLInputElement[]): void {
    if (group.current) {
      dom.sync(group.current, controls, !multiple);
    }
  }

  const sync = useRef<() => void>(() => {});
  useInsertionEffect(() => {
    sync.current = () => {
      const controls = chipInputs(options.current);
      syncValidity(controls, state.controlled ? state.read() : state.defaultValue);
      syncFocus(controls);
    };
  });
  useIsoLayoutEffect(() => {
    sync.current();
  });
  useIsoLayoutEffect(() => {
    if (group.current) {
      return observeChipAvailability(group.current, () => sync.current());
    }
  }, []);

  function select(input: HTMLInputElement, checked: boolean): boolean {
    const current = state.read();
    const key = input.value;
    if (selected(current, key) === checked) {
      state.repair();
      return false;
    }
    if (!multiple) {
      if (!checked) {
        return false;
      }
      state.propose(key, input);
    } else {
      const keys = current === null || typeof current === 'string' ? empty : current;
      state.propose(checked ? [...keys, key] : keys.filter((item) => item !== key), input);
    }
    return true;
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>): void {
    if (multiple || !radioKeys.has(event.key) || event.nativeEvent.defaultPrevented) {
      return;
    }
    const controls = chipInputs(options.current);
    const source = controls.find((input) => input === event.target);
    if (!source || !isChipAvailable(source)) {
      return;
    }
    const result = navigateCollection(
      event.nativeEvent,
      {
        activeKey: source.value,
        items: controls.map((item) => ({
          key: item.value,
          label: '',
          navigable: isChipAvailable(item),
        })),
        orientation: 'both',
        direction: isRTL(source) ? 'rtl' : 'ltr',
        typeahead: false,
        wrap: true,
      },
      null,
      0,
    );
    const target = result.handled && controls.find((item) => item.value === result.key);
    if (target) {
      completeKeydown(event.nativeEvent, source, () => {
        if (isChipAvailable(target)) {
          state.settleReset();
          if (!target.checked) {
            target.click();
          }
          if (isChipAvailable(target)) {
            target.focus();
          }
        }
      });
    }
  }

  const entry =
    !multiple && !disabled
      ? (items.find((item) => !item.disabled && selected(state.value, item.value)) ??
        items.find((item) => !item.disabled))
      : undefined;
  const eligible = items.some((item) => !item.disabled);

  return (
    <fieldset
      {...attrs}
      ref={rootRef}
      className={cx('unica-chip-group', className)}
      disabled={disabled}
      form={form}
      name={name}
      role={multiple ? undefined : 'radiogroup'}
      tabIndex={-1}
      aria-required={multiple ? undefined : required || undefined}
      aria-invalid={disabled ? undefined : invalid}
      aria-describedby={descriptions.join(' ') || undefined}
      onFocus={(event) => {
        attrs.onFocus?.(event);
        if (event.target === event.currentTarget) {
          sync.current();
        }
      }}
    >
      {present(label) && (
        <legend className="unica-chip-group-label">
          {typeof label === 'string' ? <bdi>{label}</bdi> : label}
        </legend>
      )}
      {descriptionId && (
        <div id={descriptionId} className="unica-chip-group-description">
          {typeof description === 'string' ? <bdi>{description}</bdi> : description}
        </div>
      )}
      <div ref={options} className="unica-chip-group-options" onKeyDown={navigate}>
        {items.map((item) => (
          <ChipControl
            key={item.value}
            type={multiple ? 'checkbox' : 'radio'}
            name={name}
            form={form}
            value={item.value}
            size={size}
            iconLeft={item.iconLeft}
            disabled={item.disabled}
            tabIndex={multiple ? undefined : item === entry ? 0 : -1}
            textValue={item.textValue}
            controlled={state.controlled}
            defaultChecked={selected(defaults, item.value)}
            settleReset={state.settleReset}
            repair={state.repair}
            select={select}
            onFocus={(event) => {
              dom.focus(event.currentTarget);
              sync.current();
            }}
            onBlur={(event) => {
              dom.blur(event.currentTarget, event.relatedTarget);
              queueMicrotask(() => sync.current());
            }}
          >
            {item.label}
          </ChipControl>
        ))}
      </div>
      <FormInput
        ref={witness}
        controlled
        type="checkbox"
        form={form}
        required={required && eligible}
        defaultChecked={items.some((item) => !item.disabled && selected(defaults, item.value))}
        getFocusTarget={() => chipInputs(options.current).find(isChipAvailable) ?? null}
      />
      {messageId && (
        <div id={messageId} className="unica-chip-group-message">
          {typeof message === 'string' ? <bdi>{message}</bdi> : message}
        </div>
      )}
    </fieldset>
  );
}

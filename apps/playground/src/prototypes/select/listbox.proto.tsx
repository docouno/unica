import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { Icon } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import type { ControlSize } from '../input/input.proto.js';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly group?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly icon?: GlyphSource | undefined;
}

export interface ListboxOptionProps extends ComponentPropsWithRef<'div'> {
  readonly option: SelectOption;
  readonly selected?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly unavailable?: boolean | undefined;
  readonly previewState?: 'hover' | 'pressed' | 'focus' | undefined;
}

// Shared visual anatomy. This is not the eventual package compound API.
export function ListboxOption({
  option,
  selected,
  active,
  unavailable,
  previewState,
  className = '',
  ...props
}: ListboxOptionProps): ReactElement {
  return (
    <div
      {...props}
      role="option"
      aria-selected={selected === true}
      aria-disabled={option.disabled || undefined}
      className={`choice-option-proto ${className}`}
      data-active={active || undefined}
      data-unavailable={unavailable || undefined}
      data-preview={previewState}
    >
      <span className="choice-option-check-proto" aria-hidden="true">
        <CheckIcon size="1em" weight="bold" />
      </span>
      {option.icon && (
        <span className="choice-option-icon-proto" aria-hidden="true">
          <Icon usage="slot" icon={option.icon} />
        </span>
      )}
      <span className="choice-option-copy-proto">
        <span className="choice-option-label-proto" dir="auto">
          {option.label}
        </span>
        {option.description && (
          <span className="choice-option-description-proto" dir="auto">
            {option.description}
          </span>
        )}
      </span>
    </div>
  );
}

export interface ListboxGroupProps extends ComponentPropsWithRef<'div'> {
  readonly label: string;
}

export function ListboxGroup({ label, children, ...props }: ListboxGroupProps): ReactElement {
  const id = useId();
  return (
    <div {...props} role="group" aria-labelledby={id} className="choice-group-proto">
      <div id={id} className="choice-panel-heading-proto">
        {label}
      </div>
      {children}
    </div>
  );
}

export interface ListboxProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'onChange' | 'defaultValue' | 'title'
> {
  readonly options: readonly SelectOption[];
  /** Full catalog when options is a filtered view. */
  readonly catalog?: readonly SelectOption[] | undefined;
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly values?: readonly string[] | undefined;
  readonly defaultValues?: readonly string[] | undefined;
  readonly multiple?: boolean | undefined;
  readonly onValueChange?: ((value: string | null) => void) | undefined;
  readonly onValuesChange?: ((values: readonly string[]) => void) | undefined;
  readonly activeValue?: string | undefined;
  readonly onActiveValueChange?: ((value: string) => void) | undefined;
  readonly title?: string | undefined;
  readonly footer?: ReactNode;
  readonly size?: ControlSize | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly emptyState?: ReactNode;
  readonly orphanLabels?: Readonly<Record<string, string>> | undefined;
  /** State pins only; they do not move DOM focus. */
  readonly previewOption?: string | undefined;
  readonly previewState?: 'hover' | 'pressed' | 'focus' | undefined;
  /** Search owns DOM focus in searchable Select. */
  readonly externalFocus?: boolean | undefined;
}

export function Listbox({
  options,
  catalog = options,
  value,
  defaultValue = null,
  values,
  defaultValues = [],
  multiple = false,
  onValueChange,
  onValuesChange,
  activeValue,
  onActiveValueChange,
  title,
  footer,
  size = 'm',
  disabled,
  readOnly,
  emptyState = 'No options available.',
  orphanLabels,
  previewOption,
  previewState,
  externalFocus,
  className = '',
  ref,
  ...props
}: ListboxProps): ReactElement {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(defaultValue);
  const [localValues, setLocalValues] = useState(defaultValues);
  const selected = multiple
    ? (values ?? localValues)
    : [value === undefined ? localValue : value].filter((key): key is string => key !== null);
  const missing = selected.filter((key) => !catalog.some((option) => option.value === key));
  const retained: SelectOption[] = missing.map((key) => ({
    value: key,
    label: orphanLabels?.[key] ?? 'Unavailable option',
    description:
      readOnly || disabled ? 'No longer in this catalog' : 'No longer available · select to remove',
  }));
  const entries = [...options, ...retained];
  const enabled = disabled ? [] : entries.filter((option) => !option.disabled);
  const initial =
    enabled.find((option) => selected.includes(option.value))?.value ?? enabled[0]?.value ?? '';
  const [localActive, setLocalActive] = useState(initial);
  const [keyboard, setKeyboard] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const typeahead = useRef({ text: '', time: 0 });
  const requested = activeValue ?? localActive;
  const active = enabled.some((option) => option.value === requested) ? requested : initial;
  const activate = (key: string): void => {
    setLocalActive(key);
    onActiveValueChange?.(key);
  };
  const choose = (key: string): void => {
    if (disabled || readOnly) {
      return;
    }
    if (multiple) {
      const next = selected.includes(key)
        ? selected.filter((item) => item !== key)
        : [...selected, key];
      setLocalValues(next);
      onValuesChange?.(next);
    } else {
      const next = missing.includes(key) ? null : key;
      setLocalValue(next);
      onValueChange?.(next);
    }
  };
  useLayoutEffect(() => {
    if (!keyboard && !externalFocus) {
      return;
    }
    const viewport = root.current;
    const row = viewport?.querySelector<HTMLElement>('[data-active]');
    if (!viewport || !row) {
      return;
    }
    const bounds = viewport.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    if (rect.top < bounds.top + 4) {
      viewport.scrollTop -= bounds.top + 4 - rect.top;
    } else if (rect.bottom > bounds.bottom - 4) {
      viewport.scrollTop += rect.bottom - bounds.bottom + 4;
    }
  }, [active, keyboard, externalFocus]);

  const renderOption = (option: SelectOption, index: number): ReactElement => (
    <ListboxOption
      key={option.value}
      id={`${id}-option-${index}`}
      option={option}
      selected={selected.includes(option.value)}
      unavailable={missing.includes(option.value)}
      active={!disabled && active === option.value}
      previewState={previewOption === option.value ? previewState : undefined}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch' || option.disabled || disabled) {
          return;
        }
        setKeyboard(false);
        setPointerInside(true);
        activate(option.value);
      }}
      onPointerDown={(event) => {
        setKeyboard(false);
        if (externalFocus) {
          event.preventDefault();
        }
      }}
      onClick={() => {
        if (option.disabled || disabled) {
          return;
        }
        if (!externalFocus) {
          root.current?.focus({ preventScroll: true });
        }
        activate(option.value);
        choose(option.value);
      }}
    />
  );
  const groups: { label: string; entries: { option: SelectOption; index: number }[] }[] = [];
  options.forEach((option, index) => {
    const label = option.group ?? '';
    const last = groups.at(-1);
    if (last?.label === label) {
      last.entries.push({ option, index });
    } else {
      groups.push({ label, entries: [{ option, index }] });
    }
  });
  return (
    <div
      className={`choice-list-frame-proto ${className}`}
      data-size={size}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      {title && (
        <div id={`${id}-title`} className="choice-list-title-proto">
          {title}
          {readOnly && <span>Read only</span>}
        </div>
      )}
      <div
        {...props}
        ref={(node) => {
          root.current = node;
          if (typeof ref === 'function') {
            return ref(node);
          }
          if (ref) {
            ref.current = node;
          }
        }}
        role="listbox"
        tabIndex={disabled || externalFocus ? -1 : 0}
        data-pointer-inside={pointerInside || undefined}
        onPointerLeave={() => setPointerInside(false)}
        className="choice-list-proto scrollbar-proto"
        data-focus-origin={keyboard ? 'keyboard' : 'pointer'}
        data-external-focus={externalFocus || undefined}
        data-no-active={!active || undefined}
        aria-label={props['aria-label'] ?? (!title ? 'Options' : undefined)}
        aria-labelledby={props['aria-labelledby'] ?? (title ? `${id}-title` : undefined)}
        aria-activedescendant={
          active
            ? `${id}-option-${entries.findIndex((option) => option.value === active)}`
            : undefined
        }
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        aria-multiselectable={multiple || undefined}
        onFocus={(event) => {
          if (event.target === event.currentTarget) {
            activate(initial);
          }
          setKeyboard(event.currentTarget.matches(':focus-visible'));
          props.onFocus?.(event);
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing || disabled) {
            return;
          }
          setKeyboard(true);
          const index = enabled.findIndex((option) => option.value === active);
          let next: SelectOption | undefined;
          if (event.key === 'ArrowDown') {
            next = enabled[Math.min(index + 1, enabled.length - 1)];
          } else if (event.key === 'ArrowUp') {
            next = enabled[Math.max(index - 1, 0)];
          } else if (event.key === 'Home') {
            next = enabled[0];
          } else if (event.key === 'End') {
            next = enabled.at(-1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (active) {
              choose(active);
            }
            return;
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const now = event.timeStamp;
            const previous = now - typeahead.current.time < 600 ? typeahead.current.text : '';
            const text = previous + event.key.toLowerCase();
            typeahead.current = { text, time: now };
            const prefix = new Set(text).size === 1 ? event.key.toLowerCase() : text;
            const ordered = [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
            next = ordered.find((option) => option.label.toLowerCase().startsWith(prefix));
          } else {
            return;
          }
          event.preventDefault();
          if (next) {
            activate(next.value);
          }
        }}
      >
        {groups.map((group, index) =>
          group.label ? (
            <ListboxGroup key={`${group.label}-${index}`} label={group.label}>
              {group.entries.map(({ option, index: itemIndex }) => renderOption(option, itemIndex))}
            </ListboxGroup>
          ) : (
            <div key={index}>
              {group.entries.map(({ option, index: itemIndex }) => renderOption(option, itemIndex))}
            </div>
          ),
        )}
        {entries.length === 0 && <div className="choice-panel-empty-proto">{emptyState}</div>}
        {missing.length > 0 && (
          <ListboxGroup label="Unavailable selection">
            {retained.map((option, index) => renderOption(option, options.length + index))}
          </ListboxGroup>
        )}
      </div>
      {footer && <div className="choice-panel-footer-proto">{footer}</div>}
    </div>
  );
}

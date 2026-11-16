import { useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { FormField, Input } from '../input/input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '../input/input.proto.js';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { Tag } from '../tag/tag.proto.js';
import './select.css';
import '../scrollbar/scrollbar.css';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly group?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly icon?: GlyphComponent | undefined;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size'> {
  readonly options: readonly SelectOption[];
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly iconLeft?: GlyphComponent | undefined;
}

export function Select({
  options,
  size = 'm',
  variant = 'default',
  status = 'neutral',
  label,
  description,
  message,
  iconLeft,
  className = '',
  style,
  id,
  required,
  hidden,
  ...props
}: SelectProps): ReactElement {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const describedBy =
    [
      props['aria-describedby'],
      description ? `${selectId}-description` : undefined,
      message ? `${selectId}-message` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const control = (
    <span
      className={`input-shell-proto select-shell-proto ${className}`}
      data-size={size}
      data-variant={variant}
      data-status={status}
      style={style}
      hidden={hidden}
    >
      {iconLeft && <Icon icon={iconLeft} size={size} />}
      <select
        {...props}
        id={selectId}
        required={required}
        className="select-native-proto"
        aria-invalid={status === 'danger' || props['aria-invalid'] || undefined}
        aria-describedby={describedBy}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDownIcon className="select-disclosure-proto" size="1em" aria-hidden="true" />
    </span>
  );
  return label || description || message ? (
    <FormField
      htmlFor={selectId}
      label={label}
      description={description}
      message={message}
      status={status}
      required={required}
      hidden={hidden}
    >
      {control}
    </FormField>
  ) : (
    control
  );
}

export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly options: readonly SelectOption[];
  readonly value?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly title?: string | undefined;
  readonly footer?: ReactNode;
  readonly size?: ControlSize | undefined;
}

// A visible choice panel for composition review; each row is an ordinary native button.
export function Listbox({
  options,
  value,
  onValueChange,
  title,
  footer,
  size = 's',
  className = '',
  ...props
}: ListboxProps): ReactElement {
  return (
    <PopoverContent
      {...props}
      className={`choice-panel-proto scrollbar-proto ${className}`}
      role="group"
      size={size}
    >
      {title && <div className="choice-panel-heading-proto">{title}</div>}
      {options.length === 0 && <p className="choice-panel-empty-proto">No matching results</p>}
      {options.map((option, index) => (
        <div key={option.value}>
          {option.group && option.group !== options[index - 1]?.group && (
            <div className="choice-panel-heading-proto">{option.group}</div>
          )}
          <button
            type="button"
            className="choice-option-proto"
            aria-pressed={value === option.value}
            disabled={option.disabled}
            onClick={() => onValueChange?.(option.value)}
          >
            {option.icon && <Icon icon={option.icon} size="s" />}
            <span className="choice-option-copy-proto">
              <span>{option.label}</span>
              {option.description && (
                <span className="choice-option-description-proto">{option.description}</span>
              )}
            </span>
            <CheckIcon size="1em" className="choice-option-check-proto" aria-hidden="true" />
          </button>
        </div>
      ))}
      {footer && <div className="choice-panel-footer-proto">{footer}</div>}
    </PopoverContent>
  );
}

export interface ComboboxProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  readonly options: readonly SelectOption[];
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly label?: ReactNode;
  readonly placeholder?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly iconLeft?: GlyphComponent | undefined;
}

export function Combobox({
  options,
  value,
  defaultValue = '',
  onValueChange,
  defaultOpen = false,
  label,
  placeholder = 'Search or choose…',
  disabled,
  size = 'm',
  variant = 'default',
  iconLeft = MagnifyingGlassIcon,
  className = '',
  ...props
}: ComboboxProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const current = value ?? localValue;
  const selected = options.find((option) => option.value === current);
  const shown = options.filter((option) =>
    `${option.label} ${option.description ?? ''}`
      .toLowerCase()
      .includes((query ?? '').toLowerCase()),
  );
  const choose = (next: string): void => {
    setLocalValue(next);
    setQuery(null);
    setOpen(false);
    onValueChange?.(next);
  };
  return (
    <div {...props} className={`combobox-proto ${className}`}>
      <Input
        label={label}
        size={size}
        variant={variant}
        disabled={disabled}
        placeholder={placeholder}
        iconLeft={iconLeft}
        value={open && query !== null ? query : (selected?.label ?? current)}
        aria-label={label ? undefined : 'Search choices'}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setOpen(true);
        }}
        suffix={
          <button
            type="button"
            className="field-icon-button-proto"
            aria-label={open ? 'Hide choices' : 'Show choices'}
            aria-expanded={open}
            disabled={disabled}
            onClick={() => {
              setQuery(null);
              setOpen(!open);
            }}
          >
            <CaretDownIcon size="1em" />
          </button>
        }
      />
      {open && !disabled && (
        <Listbox
          className="combobox-panel-proto"
          size={size}
          options={shown}
          value={current}
          onValueChange={choose}
          aria-label="Matching choices"
        />
      )}
    </div>
  );
}

export interface TagsInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly initialValues?: readonly string[] | undefined;
  readonly values?: readonly string[] | undefined;
  readonly onValuesChange?: ((values: readonly string[]) => void) | undefined;
  readonly label?: ReactNode;
  readonly placeholder?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly status?: FieldStatus | undefined;
  readonly size?: ControlSize | undefined;
}

export function TagsInput({
  initialValues = [],
  values,
  onValuesChange,
  label,
  placeholder = 'Add a person or email…',
  disabled,
  status = 'neutral',
  size = 'm',
  className = '',
  ...props
}: TagsInputProps): ReactElement {
  const [localValues, setLocalValues] = useState<readonly string[]>(initialValues);
  const [pending, setPending] = useState('');
  const editorRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const tags = values ?? localValues;
  const update = (next: readonly string[]): void => {
    setLocalValues(next);
    onValuesChange?.(next);
  };
  const add = (): void => {
    const candidate = pending.trim().replace(/,$/, '');
    if (candidate && !tags.includes(candidate)) {
      update([...tags, candidate]);
    }
    setPending('');
  };
  return (
    <FormField htmlFor={inputId} label={label} status={status}>
      <div
        {...props}
        className={`tags-input-proto ${className}`}
        data-status={status}
        data-disabled={disabled || undefined}
        data-size={size}
      >
        {tags.map((tag) => (
          <Tag
            key={tag}
            size={size}
            disabled={disabled === true}
            removeLabel={`Remove ${tag}`}
            onRemove={() => {
              update(tags.filter((item) => item !== tag));
              editorRef.current?.focus();
            }}
          >
            {tag}
          </Tag>
        ))}
        <input
          ref={editorRef}
          id={inputId}
          disabled={disabled}
          value={pending}
          placeholder={placeholder}
          aria-label={label ? undefined : 'Add a tag'}
          onChange={(event) => setPending(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
        />
      </div>
      {tags.length > 0 && (
        <details className="tags-input-values-proto">
          <summary>Full values ({tags.length})</summary>
          <ul>
            {tags.map((tag) => (
              <li key={tag}>
                <bdi>{tag}</bdi>
              </li>
            ))}
          </ul>
        </details>
      )}
    </FormField>
  );
}

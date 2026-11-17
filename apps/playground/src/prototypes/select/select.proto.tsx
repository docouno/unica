import { useId, useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CaretDownIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { FormField, Input } from '../input/input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '../input/input.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { Listbox } from './listbox.proto.js';
import type { SelectOption } from './listbox.proto.js';
import { SelectPanel } from './select-control.proto.js';
import { Tag } from '../tag/tag.proto.js';
import './select.css';
import '../scrollbar/scrollbar.css';

export { Listbox, ListboxGroup, ListboxOption } from './listbox.proto.js';
export type {
  SelectOption,
  ListboxProps,
  ListboxGroupProps,
  ListboxOptionProps,
} from './listbox.proto.js';
export { Select, SelectPanel } from './select-control.proto.js';
export type { SelectProps } from './select-control.proto.js';

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
        <SelectPanel className="combobox-panel-proto" size={size}>
          <Listbox
            size={size}
            options={shown}
            catalog={options}
            value={selected?.value ?? null}
            onValueChange={(next) => {
              if (next !== null) {
                choose(next);
              }
            }}
            aria-label="Matching choices"
          />
        </SelectPanel>
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

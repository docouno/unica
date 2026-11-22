import { useId, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CaretDownIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Input } from '@docouno/unica';
import type { ControlSize, FieldVariant, GlyphSource } from '@docouno/unica';
import { FormField } from '../form-field/form-field.proto.js';
import { Listbox } from './listbox.proto.js';
import type { SelectOption } from './listbox.proto.js';
import { SelectPanel } from './select-control.proto.js';
import './select.css';

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
  readonly iconLeft?: GlyphSource | undefined;
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
  const inputId = useId();
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
      <FormField label={label} htmlFor={inputId} size={size}>
        <div className="select-search-row-proto" data-size={size}>
          <Input
            id={inputId}
            className="select-search-input-proto"
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
          />
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
        </div>
      </FormField>
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

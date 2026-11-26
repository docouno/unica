import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { FieldStatus, FieldVariant } from '../../core/forms/fieldAxes.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type {
  ListboxGroupProps,
  ListboxItem,
  ListboxOptionProps,
  ListboxSection,
  PickerProps,
  PickerValueProps,
} from '../Listbox/types.js';

type TriggerOwned =
  | 'type'
  | 'role'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'disabled'
  | 'tabIndex'
  | 'name'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onChangeCapture'
  | 'form'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'command'
  | 'commandFor'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-haspopup'
  | 'aria-busy'
  | 'aria-invalid'
  | 'aria-disabled';

type ButtonProps<Replaced extends TriggerOwned = never> = Omit<
  ComponentPropsWithRef<'button'>,
  TriggerOwned
> &
  Readonly<Partial<Record<Exclude<TriggerOwned, Replaced>, never>>>;

export type SelectTriggerProps = ButtonProps & {
  readonly [attribute: `data-${string}`]: DataAttributeValue;
};

type ContentOwned =
  | 'id'
  | 'role'
  | 'popover'
  | 'tabIndex'
  | 'inert'
  | 'hidden'
  | 'autoFocus'
  | 'aria-modal'
  | 'onToggle'
  | 'onBeforeToggle'
  | 'dangerouslySetInnerHTML';

export type SelectContentProps = Omit<ComponentPropsWithRef<'div'>, ContentOwned> &
  Readonly<Partial<Record<ContentOwned, never>>> & {
    readonly [attribute: `data-${string}`]: DataAttributeValue;
  };

export type SelectOptionProps = Omit<
  ListboxOptionProps,
  'active' | 'selected' | 'size' | 'reserveIconSpace'
> &
  Readonly<Partial<Record<'active' | 'selected' | 'size' | 'reserveIconSpace', never>>>;

export type SelectGroupProps = ListboxGroupProps;

export type SelectProps = ButtonProps<
  'children' | 'disabled' | 'value' | 'defaultValue' | 'name' | 'form'
> &
  PickerProps &
  PickerValueProps & {
    readonly children?: ReactNode | undefined;
    readonly options?: readonly (ListboxItem | ListboxSection)[] | undefined;
    readonly open?: boolean | undefined;
    readonly defaultOpen?: boolean | undefined;
    readonly onOpenChange?: ((open: boolean) => void) | undefined;
    readonly variant?: FieldVariant | undefined;
    readonly status?: FieldStatus | undefined;
    readonly width?: 'auto' | 'full' | undefined;
    readonly placeholder?: string | undefined;
    readonly iconLeft?: GlyphSource | undefined;
    readonly searchable?: boolean | undefined;
    readonly clearable?: boolean | undefined;
    readonly loading?: boolean | undefined;
    readonly errorState?: ReactNode | undefined;
  };

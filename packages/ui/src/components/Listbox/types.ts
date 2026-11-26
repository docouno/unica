import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';

export interface ListboxItem {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly disabled?: boolean | undefined;
}

export interface ListboxSection {
  readonly label: string;
  readonly options: readonly ListboxItem[];
}

export interface PickerMessages {
  readonly placeholder: string;
  readonly searchLabel: string;
  readonly clearSearch: string;
  readonly clearSelection: string;
  readonly selectedValue: string;
  readonly readOnly: string;
  readonly loading: string;
  readonly updating: string;
  readonly empty: string;
  readonly unavailableGroup: string;
  readonly unavailableOption: string;
  readonly removeUnavailable: string;
  readonly unavailableDescription: string;
  readonly noMatchesHint: string;
  readonly selectedCount: (count: number) => string;
  readonly noMatches: (query: string) => string;
  readonly selectionAnnouncement: (labels: readonly string[]) => string;
}

export type PickerValueProps =
  | {
      readonly multiple?: false | undefined;
      readonly value?: string | null | undefined;
      readonly defaultValue?: string | null | undefined;
      readonly onValueChange?: ((value: string | null) => void) | undefined;
    }
  | {
      readonly multiple: true;
      readonly value?: readonly string[] | undefined;
      readonly defaultValue?: readonly string[] | undefined;
      readonly onValueChange?: ((value: readonly string[]) => void) | undefined;
    };

export interface PickerProps {
  readonly [attribute: `data-${string}`]: DataAttributeValue;
  readonly size?: ControlSize | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly messages?: Partial<PickerMessages> | undefined;
  readonly selectedLabels?: Readonly<Record<string, string>> | undefined;
  readonly emptyState?: ReactNode | undefined;
}

type CommonOwned = 'role' | 'tabIndex' | 'dangerouslySetInnerHTML';
type PartOwned = CommonOwned | 'hidden' | 'inert' | 'aria-hidden';
type OptionOwned =
  PartOwned | 'children' | 'aria-label' | 'aria-labelledby' | 'aria-selected' | 'aria-disabled';
type GroupOwned = PartOwned | 'aria-label' | 'aria-labelledby';

type DivProps<T extends keyof ComponentPropsWithRef<'div'>> = Omit<
  ComponentPropsWithRef<'div'>,
  T
> &
  Readonly<Partial<Record<T, never>>>;

export type ListboxOptionProps = DivProps<OptionOwned> &
  ListboxItem & {
    readonly [attribute: `data-${string}`]: DataAttributeValue;
    readonly size?: ControlSize | undefined;
    readonly active?: boolean | undefined;
    readonly selected?: boolean | undefined;
    readonly reserveIconSpace?: boolean | undefined;
  };

export type ListboxGroupProps = DivProps<GroupOwned> & {
  readonly [attribute: `data-${string}`]: DataAttributeValue;
  readonly label: string;
};

type ListboxOwned =
  | CommonOwned
  | 'children'
  | 'defaultValue'
  | 'onChange'
  | 'onChangeCapture'
  | 'aria-activedescendant'
  | 'aria-disabled'
  | 'aria-multiselectable'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-orientation';

type ListboxName =
  | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
  | { readonly 'aria-label'?: string | undefined; readonly 'aria-labelledby': string };

type ListboxSource =
  | { readonly options: readonly (ListboxItem | ListboxSection)[]; readonly children?: never }
  | { readonly options?: never; readonly children: ReactNode };

export type ListboxProps = Omit<ComponentPropsWithRef<'div'>, ListboxOwned> &
  Readonly<Partial<Record<Exclude<ListboxOwned, 'children' | 'defaultValue'>, never>>> &
  ListboxName &
  ListboxSource &
  PickerValueProps &
  PickerProps;

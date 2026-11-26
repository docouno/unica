import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { GlyphSource } from '../../core/glyph.js';

type ChipStyle = CSSProperties & { readonly '--chip-max-width'?: string | undefined };
type RichText = Exclude<ReactNode, string | boolean | null | undefined>;

type ChipText<Slot extends 'children' | 'label'> =
  | (Readonly<Record<Slot, string>> & { readonly textValue?: string | undefined })
  | (Readonly<Record<Slot, RichText>> & { readonly textValue: string });

interface ChipPresentation {
  readonly size?: ControlSize | undefined;
  readonly style?: ChipStyle | undefined;
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
  readonly 'data-preview'?: never;
}

type ReservedInputProps =
  | 'children'
  | 'size'
  | 'style'
  | 'type'
  | 'role'
  | 'readOnly'
  | 'aria-checked'
  | 'aria-readonly'
  | 'dangerouslySetInnerHTML';

export type ChipProps = Omit<ComponentPropsWithRef<'input'>, ReservedInputProps> &
  ChipPresentation &
  ChipText<'children'> & {
    readonly iconLeft?: GlyphSource | undefined;
    readonly onCheckedChange?: ((next: boolean) => void) | undefined;
  };

type ChipOption = ChipText<'label'> & {
  readonly value: string;
  readonly iconLeft?: GlyphSource | undefined;
  readonly disabled?: boolean | undefined;
};

type ChipGroupName =
  | { readonly label: string | RichText }
  | { readonly 'aria-label': string }
  | { readonly 'aria-labelledby': string };

type ChipGroupBase = Omit<
  ComponentPropsWithRef<'fieldset'>,
  | 'children'
  | 'onChange'
  | 'defaultValue'
  | 'style'
  | 'role'
  | 'tabIndex'
  | 'aria-readonly'
  | 'dangerouslySetInnerHTML'
> &
  ChipPresentation &
  ChipGroupName & {
    readonly label?: string | RichText | undefined;
    readonly items: readonly ChipOption[];
    readonly description?: ReactNode;
    readonly message?: ReactNode;
    readonly required?: boolean | undefined;
    readonly status?: 'neutral' | 'danger' | undefined;
  };

export type ChipGroupProps = ChipGroupBase &
  (
    | {
        readonly multiple?: false | undefined;
        readonly value?: string | null | undefined;
        readonly defaultValue?: string | null | undefined;
        readonly onValueChange?: ((next: string) => void) | undefined;
      }
    | {
        readonly multiple: true;
        readonly value?: readonly string[] | undefined;
        readonly defaultValue?: readonly string[] | undefined;
        readonly onValueChange?: ((next: readonly string[]) => void) | undefined;
      }
  );

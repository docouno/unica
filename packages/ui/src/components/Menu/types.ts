import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import type { GlyphSource } from '../../core/glyph.js';
import type { DividerProps } from '../Divider/types.js';
import type { MENU_ALIGN, MENU_SIZE, MENU_TONE } from './consts.js';

export type MenuSize = keyof typeof MENU_SIZE;
export type MenuAlign = keyof typeof MENU_ALIGN;
export type MenuTone = keyof typeof MENU_TONE;

export interface MenuProps {
  readonly children: ReactNode;
  readonly ref?: Ref<HTMLButtonElement> | undefined;
  readonly size?: MenuSize | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface ContextMenuInvocation {
  readonly kind: 'button' | 'pointer' | 'keyboard' | 'touch';
  readonly source: Element;
  readonly selection: string;
  readonly native: boolean;
}

export interface ContextMenuProps extends MenuProps {
  readonly longPress?: boolean | undefined;
  readonly shouldOpen?: ((context: ContextMenuInvocation) => boolean) | undefined;
  readonly onInvoke?: ((context: ContextMenuInvocation) => void) | undefined;
}

type OwnedMenuAttributes =
  | 'role'
  | 'tabIndex'
  | 'popover'
  | 'dangerouslySetInnerHTML'
  | 'aria-haspopup'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-checked'
  | 'aria-disabled';

type UnavailableAttribute<Names extends string> = {
  readonly [Name in Names]?: never;
};

type DataAttributes = {
  readonly [attribute: `data-${string}`]: string | number | boolean | undefined;
};

type ButtonInvocationAttribute =
  | 'type'
  | 'name'
  | 'value'
  | 'autoFocus'
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
  | 'commandfor';

type ButtonAttributes = Omit<
  ComponentPropsWithRef<'button'>,
  OwnedMenuAttributes | ButtonInvocationAttribute
> &
  UnavailableAttribute<OwnedMenuAttributes | ButtonInvocationAttribute> &
  DataAttributes;

export interface MenuTriggerProps extends ButtonAttributes {
  readonly asChild?: boolean | undefined;
}

export interface ContextMenuTriggerProps<T extends HTMLElement = HTMLElement>
  extends
    DataAttributes,
    Omit<HTMLAttributes<T>, 'children' | 'role' | 'tabIndex' | 'dangerouslySetInnerHTML'> {
  readonly children: ReactElement;
  readonly ref?: Ref<T> | undefined;
}

type PanelAttributes = Omit<ComponentPropsWithRef<'div'>, OwnedMenuAttributes | 'autoFocus'> &
  UnavailableAttribute<OwnedMenuAttributes | 'autoFocus'> &
  DataAttributes;

export interface MenuContentProps extends PanelAttributes {
  readonly align?: MenuAlign | undefined;
}

interface RowSlots {
  readonly children: string;
  readonly description?: string | undefined;
  readonly icon?: GlyphSource | undefined;
  readonly disabled?: boolean | undefined;
}

type ButtonRow = Omit<ButtonAttributes, 'children' | 'disabled'> & RowSlots;

interface CommandSlots {
  readonly shortcut?: string | undefined;
  readonly tone?: MenuTone | undefined;
}

export type MenuButtonItemProps = Omit<ButtonRow, 'rel'> &
  CommandSlots & {
    readonly href?: never;
    readonly type?: never;
    readonly target?: never;
    readonly rel?: never;
    readonly download?: never;
    readonly hrefLang?: never;
    readonly ping?: never;
    readonly referrerPolicy?: never;
    readonly media?: never;
  };
export type MenuLinkItemProps = Omit<
  ComponentPropsWithRef<'a'>,
  OwnedMenuAttributes | 'children' | 'href' | 'autoFocus'
> &
  UnavailableAttribute<OwnedMenuAttributes | 'autoFocus'> &
  DataAttributes &
  RowSlots &
  CommandSlots & { readonly href: string };
export type MenuItemProps = MenuButtonItemProps | MenuLinkItemProps;

export type MenuCheckboxItemProps = ButtonRow & {
  readonly checked?: boolean | undefined;
  readonly defaultChecked?: boolean | undefined;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
};

export type MenuRadioItemProps = Omit<ButtonRow, 'value'> & { readonly value: string };
export type MenuGroupProps = PanelAttributes;
export type MenuLabelProps = PanelAttributes;
export type MenuSeparatorProps = Omit<
  Extract<DividerProps, { readonly decorative: false }>,
  'decorative' | 'orientation'
>;

export interface MenuRadioGroupProps extends Omit<MenuGroupProps, 'defaultValue'> {
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
}

export interface MenuSubProps {
  readonly children: ReactNode;
  readonly ref?: Ref<HTMLButtonElement> | undefined;
}

export type MenuSubTriggerProps = ButtonRow;

export interface MenuSubContentProps
  extends
    Omit<PanelAttributes, 'aria-label' | 'aria-labelledby'>,
    UnavailableAttribute<'aria-label' | 'aria-labelledby'> {
  readonly backLabel?: string | undefined;
}

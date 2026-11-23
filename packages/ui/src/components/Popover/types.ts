import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import type { SIZE } from '../../consts.js';
import type { Align, Side } from '../../core/overlay/positioning.js';
import type { ExactAxisSubset } from '../../types.js';
import type { HeadingTag } from '../Title/types.js';
import type { POPOVER_SIZE } from './consts.js';

export type PopoverSize = ExactAxisSubset<
  typeof SIZE,
  typeof POPOVER_SIZE
>[keyof typeof POPOVER_SIZE];
export type PopoverSide = Side;
export type PopoverAlign = Align;

export interface PopoverProps {
  readonly children: ReactNode;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly ref?: Ref<HTMLDivElement> | undefined;
}

type TriggerOwned =
  | 'type'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'command'
  | 'commandFor'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-haspopup';

interface NativeTriggerProps extends Omit<ComponentPropsWithRef<'button'>, TriggerOwned> {
  readonly asChild?: false | undefined;
}

interface SlottedTriggerProps extends Omit<HTMLAttributes<HTMLElement>, TriggerOwned | 'children'> {
  readonly asChild: true;
  readonly children: ReactElement;
  readonly disabled?: boolean | undefined;
  readonly ref?: Ref<HTMLElement> | undefined;
}

export type PopoverTriggerProps = NativeTriggerProps | SlottedTriggerProps;

export interface PopoverContentProps extends Omit<
  ComponentPropsWithRef<'div'>,
  | 'role'
  | 'popover'
  | 'tabIndex'
  | 'autoFocus'
  | 'inert'
  | 'hidden'
  | 'aria-modal'
  | 'onToggle'
  | 'onBeforeToggle'
  | 'dangerouslySetInnerHTML'
> {
  readonly size?: PopoverSize | undefined;
  readonly side?: PopoverSide | undefined;
  readonly align?: PopoverAlign | undefined;
}

export type PopoverHeaderProps = ComponentPropsWithRef<'div'>;
export type PopoverBodyProps = ComponentPropsWithRef<'div'>;
export type PopoverFooterProps = ComponentPropsWithRef<'div'>;

export interface PopoverTitleProps extends ComponentPropsWithRef<'h3'> {
  readonly as?: HeadingTag | undefined;
}

export type PopoverDescriptionProps = ComponentPropsWithRef<'p'>;

export type PopoverCloseProps = Omit<
  ComponentPropsWithRef<'button'>,
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'type'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'command'
  | 'commandFor'
>;

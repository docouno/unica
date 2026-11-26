import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from 'react';

export type DialogSize = 's' | 'm' | 'l';
export type DialogSide = 'start' | 'end' | 'top' | 'bottom';

export interface ResponsiveDialogSide {
  readonly narrow: DialogSide;
  readonly wide: DialogSide;
}

export interface DialogRootProps {
  readonly children: ReactNode;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly ref?: Ref<HTMLDialogElement> | undefined;
}

type ActionOwned =
  | 'type'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'command'
  | 'commandFor'
  | 'dangerouslySetInnerHTML';

type TriggerOwned = 'aria-controls' | 'aria-expanded' | 'aria-haspopup';

interface NativeActionProps extends Omit<ComponentPropsWithRef<'button'>, ActionOwned> {
  readonly asChild?: false | undefined;
}

interface SlottedActionProps extends Omit<HTMLAttributes<HTMLElement>, ActionOwned | 'children'> {
  readonly asChild: true;
  readonly children: ReactElement;
  readonly disabled?: boolean | undefined;
  readonly ref?: Ref<HTMLElement> | undefined;
}

export type DialogTriggerProps =
  Omit<NativeActionProps, TriggerOwned> | Omit<SlottedActionProps, TriggerOwned>;

export type DialogCloseProps = NativeActionProps | SlottedActionProps;

export interface DialogContentProps extends Omit<
  ComponentPropsWithRef<'dialog'>,
  | 'open'
  | 'role'
  | 'closedBy'
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
  readonly size?: DialogSize | undefined;
  readonly width?: DialogSize | undefined;
  readonly dismissOnBackdrop?: boolean | undefined;
  readonly initialFocus?: RefObject<HTMLElement | null> | undefined;
  readonly returnFocus?: RefObject<HTMLElement | null> | undefined;
}

export type DialogHeaderProps = ComponentPropsWithRef<'header'>;
export type DialogTitleProps = ComponentPropsWithRef<'h2'>;
export type DialogDescriptionProps = ComponentPropsWithRef<'p'>;
export type DialogBodyProps = Omit<ComponentPropsWithRef<'div'>, 'dangerouslySetInnerHTML'>;
export type DialogFooterProps = ComponentPropsWithRef<'footer'>;

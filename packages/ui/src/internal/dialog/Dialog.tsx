import { createContext, use, useCallback, useId, useMemo, useRef, useState } from 'react';
import type { DOMAttributes, MouseEvent, ReactElement, Ref } from 'react';
import { Portal } from '../../core/Portal.js';
import { Slot, requireSlotChild, resolveSlotProps } from '../../core/Slot.js';
import { cx } from '../../core/cx.js';
import { getRootNodeSafe, isInertElement, matchesSafe } from '../../core/dom.js';
import { defineGlyph } from '../../core/glyph.js';
import { guardActivation } from '../../core/guardActivation.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { PortalContext } from '../../core/portal-context.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CloseGlyph } from '../glyphs/index.js';
import { IconButton } from '../../components/Button/IconButton.js';
import { DrawerGrip } from '../../components/Drawer/DrawerGrip.js';
import { createDialogLabels, DialogLabelContext, useDialogLabelRef } from './labels.js';
import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogRootProps,
  DialogSide,
  DialogTitleProps,
  DialogTriggerProps,
  ResponsiveDialogSide,
} from './types.js';
import { useBackdropDismiss } from './useBackdropDismiss.js';
import { useDialogGeometry } from './useDialogGeometry.js';
import { useNativeDialog } from './useNativeDialog.js';
import type { DialogActivation } from './useNativeDialog.js';
import './dialog.css';

type Kind = 'modal' | 'drawer';

interface ContentView {
  readonly dialog: HTMLDialogElement;
  readonly id: string;
  readonly expanded: boolean;
}

interface RootContext {
  readonly kind: Kind;
  readonly fallbackId: string;
  readonly dialogRef: Ref<HTMLDialogElement> | undefined;
  readonly requestOpen: (activation: DialogActivation) => void;
  readonly takeActivation: () => DialogActivation | null;
  readonly requested: boolean;
  readonly readOpen: () => boolean;
  readonly propose: (open: boolean) => void;
  readonly content: ContentView | null;
  readonly publish: (view: ContentView) => void;
  readonly detach: (dialog: HTMLDialogElement) => void;
}

const DialogRootContext = createContext<RootContext | null>(null);
const AncestorDialog = createContext<{ readonly open: boolean; readonly closing: boolean } | null>(
  null,
);
const closeGlyph = /* @__PURE__ */ defineGlyph(CloseGlyph, 'native');

function useDialogRoot(): RootContext {
  const root = use(DialogRootContext);
  if (!root) {
    throw new Error('Modal and Drawer parts require a Modal or Drawer root.');
  }
  return root;
}

export function DialogRoot({
  kind,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  ref,
}: DialogRootProps & { readonly kind: Kind }): ReactElement {
  const fallbackId = useId();
  const activationRef = useRef<DialogActivation | null>(null);
  const takeActivation = useCallback((): DialogActivation | null => {
    const activation = activationRef.current;
    activationRef.current = null;
    return activation;
  }, []);
  const [content, setContent] = useState<ContentView | null>(null);
  const [requested, { read, propose }] = useStateAuthority({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const requestOpen = useCallback(
    (activation: DialogActivation): void => {
      activationRef.current = activation;
      propose(true);
      // A refused or deferred request cannot own a separate future opening.
      queueMicrotask(() => {
        if (activationRef.current === activation && !read()) {
          activationRef.current = null;
        }
      });
    },
    [propose, read],
  );
  const publish = useCallback((next: ContentView): void => {
    setContent((current) =>
      current?.dialog === next.dialog &&
      current.id === next.id &&
      current.expanded === next.expanded
        ? current
        : next,
    );
  }, []);
  const detach = useCallback((dialog: HTMLDialogElement): void => {
    setContent((current) => (current?.dialog === dialog ? null : current));
  }, []);
  const root = useMemo(
    () => ({
      kind,
      fallbackId,
      dialogRef: ref,
      requestOpen,
      takeActivation,
      requested,
      readOpen: read,
      propose,
      content,
      publish,
      detach,
    }),
    [
      kind,
      fallbackId,
      ref,
      requestOpen,
      takeActivation,
      requested,
      read,
      propose,
      content,
      publish,
      detach,
    ],
  );
  return <DialogRootContext value={root}>{children}</DialogRootContext>;
}

function canActivate(target: HTMLElement, disabled: boolean | undefined): boolean {
  return (
    !disabled &&
    target.isConnected &&
    !matchesSafe(target, ':disabled, [aria-disabled="true" i]') &&
    !isInertElement(target)
  );
}

function DialogAction({
  action,
  props,
}: {
  readonly action: 'trigger' | 'close';
  readonly props: DialogTriggerProps | DialogCloseProps;
}): ReactElement {
  const root = useDialogRoot();
  const {
    asChild,
    className,
    children,
    disabled,
    onClick,
    onPointerDown,
    onPointerCancel,
    onKeyDown,
    ref,
    ...nativeProps
  } = props;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const actionRef = useMemo(
    () => mergeRefs<HTMLElement>(setNode, ref as Ref<HTMLElement> | undefined),
    [ref],
  );
  const pointer = useRef<string | undefined>(undefined);
  const trigger = action === 'trigger';
  const content = root.content;
  const blocked = (target: HTMLElement): boolean => !canActivate(target, disabled);
  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    const from = pointer.current;
    pointer.current = undefined;
    if (event.defaultPrevented || blocked(event.currentTarget)) {
      return;
    }
    (onClick as typeof handleClick | undefined)?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      (event.currentTarget.localName === 'a' &&
        (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey))
    ) {
      return;
    }
    event.preventDefault();
    if (trigger && !root.readOpen()) {
      const native = event.nativeEvent;
      const nativePointer =
        'pointerType' in native && typeof native.pointerType === 'string'
          ? native.pointerType
          : undefined;
      root.requestOpen({
        invoker: event.currentTarget,
        pointer: native.isTrusted
          ? event.detail === 0
            ? 'keyboard'
            : nativePointer || from
          : undefined,
      });
    } else if (!trigger && root.readOpen() && content?.dialog.matches(':modal')) {
      root.propose(false);
    }
  };
  const binding = trigger
    ? {
        'aria-controls':
          node &&
          content?.dialog.isConnected &&
          getRootNodeSafe(node) === getRootNodeSafe(content.dialog)
            ? content.id
            : undefined,
        'aria-expanded': content?.expanded ?? false,
        'aria-haspopup': 'dialog' as const,
      }
    : undefined;
  const interaction = {
    onClick: handleClick,
    onPointerDown(event) {
      (onPointerDown as DOMAttributes<HTMLElement>['onPointerDown'])?.(event);
      if (!event.defaultPrevented) {
        pointer.current = event.pointerType;
      }
    },
    onPointerCancel(event) {
      (onPointerCancel as DOMAttributes<HTMLElement>['onPointerCancel'])?.(event);
      pointer.current = undefined;
    },
    onKeyDown(event) {
      (onKeyDown as DOMAttributes<HTMLElement>['onKeyDown'])?.(event);
      pointer.current = undefined;
    },
  } satisfies DOMAttributes<HTMLElement>;
  const actionClass = cx(trigger ? 'unica-dialog-trigger' : 'unica-dialog-close', className);
  if (asChild) {
    const child = requireSlotChild<HTMLElement>(
      children,
      trigger ? 'DialogTrigger' : 'DialogClose',
    );
    const attrs = { ...nativeProps, ...interaction, className: actionClass };
    const disabledProps = disabled
      ? {
          'aria-disabled': true,
          ...(child.type === 'button' || typeof child.type !== 'string' ? { disabled } : undefined),
          ...(child.type === 'a'
            ? { href: undefined, role: child.props.role ?? nativeProps.role ?? 'link' }
            : undefined),
        }
      : undefined;
    return (
      <Slot
        {...attrs}
        ref={actionRef}
        slotOwned={{
          ...binding,
          ...disabledProps,
          ...(child.type === 'button' || typeof child.type !== 'string'
            ? { type: 'button' }
            : undefined),
          popoverTarget: undefined,
          popoverTargetAction: undefined,
          command: undefined,
          commandfor: undefined,
          ...(Object.hasOwn(child.props, 'commandFor') ? { commandFor: undefined } : undefined),
          ...(disabled
            ? guardActivation(
                resolveSlotProps({
                  slotProps: { ...nativeProps, onClick, onPointerDown, onPointerCancel, onKeyDown },
                  childProps: child.props,
                }) as DOMAttributes<HTMLElement>,
                blocked,
              )
            : undefined),
        }}
      >
        {child}
      </Slot>
    );
  }
  const buttonProps = {
    ...nativeProps,
    ...interaction,
    ...binding,
    disabled,
    ref: actionRef,
    type: 'button' as const,
  };
  if (!trigger && children === undefined) {
    const {
      'aria-label': label,
      'aria-labelledby': labelledBy,
      'aria-disabled': ariaDisabled,
    } = nativeProps;
    const iconAttributes = { ...nativeProps };
    delete iconAttributes['aria-busy'];
    delete iconAttributes['aria-disabled'];
    delete iconAttributes['aria-pressed'];
    delete iconAttributes.rel;
    const iconProps: Omit<
      typeof iconAttributes,
      'aria-busy' | 'aria-disabled' | 'aria-pressed' | 'rel'
    > = iconAttributes;
    const defaultLabel = root.kind === 'drawer' ? 'Close drawer' : 'Close dialog';
    const name =
      !label && labelledBy
        ? { 'aria-labelledby': labelledBy }
        : { 'aria-label': label || defaultLabel, 'aria-labelledby': labelledBy };
    return (
      <IconButton
        {...iconProps}
        {...interaction}
        {...name}
        className={cx(actionClass, 'unica-dialog-close-icon')}
        disabled={disabled || ariaDisabled === true || ariaDisabled === 'true'}
        icon={closeGlyph}
        ref={actionRef}
        size="s"
        tone="neutral"
        type="button"
        variant="ghost"
      />
    );
  }
  return (
    <button {...buttonProps} className={actionClass}>
      {children}
    </button>
  );
}

/** Opens the dialog from a native button or a composed interactive element. */
export function DialogTrigger(props: DialogTriggerProps): ReactElement {
  return <DialogAction action="trigger" props={props} />;
}

/** Requests dismissal from a visible, localizable action inside the dialog. */
export function DialogClose(props: DialogCloseProps): ReactElement {
  return <DialogAction action="close" props={props} />;
}

interface ContentOptions extends DialogContentProps {
  readonly role: 'dialog' | 'alertdialog';
  readonly side: 'center' | DialogSide | ResponsiveDialogSide;
  readonly swipeToClose?: boolean | undefined;
}

export function DialogContent(props: ContentOptions): ReactElement {
  return (
    <Portal>
      <DialogCarrier {...props} />
    </Portal>
  );
}

function DialogCarrier({
  id,
  role,
  side,
  size = 'm',
  width = 'm',
  className,
  children,
  dismissOnBackdrop = false,
  initialFocus,
  returnFocus,
  swipeToClose,
  ref,
  'aria-labelledby': labelledBy,
  'aria-label': label,
  'aria-describedby': describedBy,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...nativeProps
}: ContentOptions): ReactElement {
  const root = useDialogRoot();
  const parent = use(AncestorDialog);
  const contentId = id ?? root.fallbackId;
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [labels] = useState(createDialogLabels);
  const { dialogRef, publish, detach } = root;
  const assignDialog = useMemo(
    () => mergeRefs<HTMLDialogElement>(setDialog, dialogRef, ref),
    [dialogRef, ref],
  );

  useIsoLayoutEffect(() => {
    if (dialog) {
      labels.update(dialog, { labelledBy, label, describedBy });
    }
  });
  const { propose, readOpen } = root;
  const requestClose = useCallback(() => {
    if (readOpen()) {
      propose(false);
    }
  }, [propose, readOpen]);
  const phase = useNativeDialog({
    dialog,
    surface,
    labels,
    requested: root.requested,
    parentOpen: parent?.open,
    parentClosing: parent?.closing,
    readOpen: root.readOpen,
    requestClose,
    takeActivation: root.takeActivation,
    initialFocus,
    returnFocus,
  });
  const expanded = phase === 'open';
  const edge = useDialogGeometry(dialog, surface, expanded, side);
  const backdrop = useBackdropDismiss(surface, dismissOnBackdrop && expanded, requestClose, {
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  });
  useIsoLayoutEffect(() => {
    if (dialog) {
      publish({ dialog, id: contentId, expanded });
    }
  }, [dialog, contentId, expanded, publish]);
  useIsoLayoutEffect(() => (dialog ? () => detach(dialog) : undefined), [dialog, detach]);

  const ancestry = useMemo(
    () => ({
      open: expanded,
      closing: !root.requested || parent?.closing === true,
    }),
    [expanded, root.requested, parent?.closing],
  );

  return (
    <dialog
      {...nativeProps}
      {...backdrop}
      aria-label={label}
      className={cx('unica-dialog', className)}
      data-surface="overlay"
      data-unica-dialog={root.kind}
      data-unica-dialog-side={edge}
      data-unica-dialog-size={size}
      data-unica-dialog-width={width}
      id={contentId}
      ref={assignDialog}
      role={role}
    >
      {phase !== 'closed' && (
        <PortalContext value={dialog}>
          <AncestorDialog value={ancestry}>
            <DialogLabelContext value={labels}>
              <div
                className="unica-dialog-surface unica-scrollbar unica-scrollbar--compact"
                ref={setSurface}
                tabIndex={-1}
              >
                {edge === 'bottom' && swipeToClose && (
                  <DrawerGrip dialog={dialog} surface={surface} onDismiss={requestClose} />
                )}
                {children}
              </div>
            </DialogLabelContext>
          </AncestorDialog>
        </PortalContext>
      )}
    </dialog>
  );
}

/** Keeps the title, optional description, and close action above the body. */
export function DialogHeader({ className, ...props }: DialogHeaderProps): ReactElement {
  return <header {...props} className={cx('unica-dialog-header', className)} />;
}

/** Names the dialog and provides its default initial focus target. */
export function DialogTitle({
  className,
  id,
  ref,
  tabIndex = -1,
  ...props
}: DialogTitleProps): ReactElement {
  const fallbackId = useId();
  const titleId = id ?? fallbackId;
  const titleRef = useDialogLabelRef('title', titleId, ref);
  return (
    <h2
      {...props}
      className={cx('unica-dialog-title', className)}
      id={titleId}
      ref={titleRef}
      tabIndex={tabIndex}
    />
  );
}

/** Supplies a short description for the dialog's accessible announcement. */
export function DialogDescription({
  className,
  id,
  ref,
  ...props
}: DialogDescriptionProps): ReactElement {
  const fallbackId = useId();
  const descriptionId = id ?? fallbackId;
  const descriptionRef = useDialogLabelRef('description', descriptionId, ref);
  return (
    <p
      {...props}
      className={cx('unica-dialog-description', className)}
      id={descriptionId}
      ref={descriptionRef}
    />
  );
}

/** Owns the normal dialog scroll area below the header and above the actions. */
export function DialogBody({
  children,
  className,
  tabIndex,
  ...props
}: DialogBodyProps): ReactElement {
  return (
    <div
      {...props}
      className={cx('unica-dialog-body unica-scrollbar unica-scrollbar--compact', className)}
      data-unica-dialog-body-tabindex={tabIndex === undefined ? undefined : ''}
      tabIndex={tabIndex}
    >
      <div className="unica-dialog-body-content">{children}</div>
    </div>
  );
}

/** Aligns the dialog's actions at inline end and preserves their source order. */
export function DialogFooter({ className, ...props }: DialogFooterProps): ReactElement {
  return <footer {...props} className={cx('unica-dialog-footer', className)} />;
}

import { createContext, useContext, useId, useLayoutEffect, useRef } from 'react';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from 'react';
import { XIcon } from '@phosphor-icons/react';
import { Button, IconButton } from '../button/button.proto.js';
import type { ButtonProps } from '../button/button.proto.js';
import './dialog.css';
import '../scrollbar/scrollbar.css';

export type DialogSize = 's' | 'm' | 'l';
export type DrawerSide = 'start' | 'end' | 'top' | 'bottom';

export interface DialogRootProps {
  readonly open: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly children: ReactNode;
}

interface DialogContextValue extends Pick<DialogRootProps, 'open'> {
  readonly id: string;
  readonly onOpenChange: DialogRootProps['onOpenChange'];
  readonly trigger: RefObject<HTMLButtonElement | null>;
  readonly launchedRef: RefObject<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog(): DialogContextValue {
  const dialog = useContext(DialogContext);
  if (!dialog) {
    throw new Error('Dialog parts require a Modal or Drawer root.');
  }
  return dialog;
}

function DialogRoot({ open, onOpenChange, children }: DialogRootProps): ReactElement {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const launchedRef = useRef(false);
  return (
    <DialogContext value={{ id, open, onOpenChange, trigger, launchedRef }}>
      {children}
    </DialogContext>
  );
}

function DialogTrigger({ onClick, ...props }: Omit<ButtonProps, 'ref'>): ReactElement {
  const { id, open, onOpenChange, trigger, launchedRef } = useDialog();
  return (
    <Button
      aria-haspopup="dialog"
      aria-controls={open ? id : undefined}
      {...props}
      ref={trigger}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          launchedRef.current = true;
          onOpenChange?.(true);
        }
      }}
    />
  );
}

export interface DialogContentProps {
  readonly size?: DialogSize;
  readonly width?: DialogSize;
  readonly described?: boolean;
  readonly inactive?: boolean;
  readonly dismissOnBackdrop?: boolean;
  readonly initialFocus?: 'panel' | RefObject<HTMLElement | null> | undefined;
  readonly returnFocus?: RefObject<HTMLElement | null>;
  readonly notification?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

export interface ModalContentProps extends DialogContentProps {
  readonly role?: 'dialog' | 'alertdialog';
}

interface DialogSurfaceProps extends ModalContentProps {
  readonly side: 'center' | DrawerSide;
  readonly dragHandle?: ReactNode;
}

function observeOverflow(panel: HTMLElement): () => void {
  const body = panel.querySelector<HTMLElement>(':scope > .dialog-body');
  const content = body?.firstElementChild;
  const header = panel.querySelector(':scope > .dialog-header');
  const footer = panel.querySelector(':scope > .dialog-footer');
  const handle = panel.querySelector(':scope > .dialog-handle');
  const update = (): void => {
    // Measure the available reading area without relying on the current scroll mode.
    const chromeHeight = [header, footer, handle].reduce(
      (height, part) => height + (part?.getBoundingClientRect().height ?? 0),
      0,
    );
    const available = panel.clientHeight - chromeHeight;
    const natural = content?.getBoundingClientRect().height ?? 0;
    const whole = available < Math.min(96, natural) - 1;
    panel.toggleAttribute('data-whole-scroll', whole);
    panel.tabIndex = whole ? 0 : -1;
    if (body) {
      const overflowing = !whole && body.scrollHeight > body.clientHeight + 1;
      body.tabIndex = overflowing ? 0 : -1;
      panel.toggleAttribute('data-before-content', overflowing && body.scrollTop > 1);
      panel.toggleAttribute(
        'data-after-content',
        overflowing && body.scrollTop + body.clientHeight < body.scrollHeight - 1,
      );
    }
  };
  const observer = new ResizeObserver(update);
  for (const element of [panel, body, content, header, footer, handle]) {
    if (element) {
      observer.observe(element);
    }
  }
  body?.addEventListener('scroll', update, { passive: true });
  update();
  return () => {
    observer.disconnect();
    body?.removeEventListener('scroll', update);
  };
}

function wrapPreviewTab(event: KeyboardEvent<HTMLDivElement>): void {
  const stops = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length,
  );
  const active = event.currentTarget.ownerDocument.activeElement;
  const first = stops[0];
  const last = stops.at(-1);
  if (!active || !first || !last) {
    return;
  }
  const boundary = event.shiftKey ? first : last;
  const direction = event.shiftKey
    ? Node.DOCUMENT_POSITION_FOLLOWING
    : Node.DOCUMENT_POSITION_PRECEDING;
  if (active === boundary || (active.compareDocumentPosition(boundary) & direction) !== 0) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

// Each preview is bounded by its artboard, including in the six-up comparison.
function DialogSurface({
  size = 'm',
  width = 'm',
  side,
  described = false,
  inactive = false,
  dismissOnBackdrop = false,
  initialFocus,
  returnFocus,
  notification,
  className = '',
  role = 'dialog',
  dragHandle,
  children,
}: DialogSurfaceProps): ReactElement | null {
  const { id, open, onOpenChange, trigger, launchedRef } = useDialog();
  const panel = useRef<HTMLElement>(null);
  const backdropPress = useRef(false);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      if (initialFocus === 'panel') {
        panel.current?.focus({ preventScroll: true });
      } else if (initialFocus) {
        initialFocus.current?.focus({ preventScroll: true });
      } else if (launchedRef.current) {
        panel.current?.focus({ preventScroll: true });
      }
    }
    if (!open && wasOpen.current) {
      (returnFocus?.current ?? trigger.current)?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [initialFocus, launchedRef, open, returnFocus, trigger]);

  useLayoutEffect(() => {
    if (open && panel.current) {
      return observeOverflow(panel.current);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`dialog-layer ${className}`}
      data-dialog-side={side}
      inert={inactive}
      onKeyDown={(event) => {
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === 'Tab') {
          wrapPreviewTab(event);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onOpenChange?.(false);
        }
      }}
    >
      <div
        className="dialog-scrim"
        aria-hidden="true"
        onPointerDown={(event) => {
          backdropPress.current = event.isPrimary && event.button === 0;
        }}
        onPointerCancel={() => {
          backdropPress.current = false;
        }}
        onPointerUp={(event) => {
          const scrim = event.currentTarget;
          const pressedHere = backdropPress.current;
          backdropPress.current = false;
          // Touch can implicitly capture the pointer to the scrim.
          if (
            dismissOnBackdrop &&
            pressedHere &&
            event.isPrimary &&
            scrim.ownerDocument.elementFromPoint(event.clientX, event.clientY) === scrim
          ) {
            onOpenChange?.(false);
          }
        }}
      />
      <div className="dialog-placement">
        <section
          ref={panel}
          className="dialog-surface scrollbar-proto"
          data-surface="overlay"
          data-dialog-size={size}
          data-dialog-width={width}
          role={role}
          tabIndex={-1}
          id={id}
          aria-labelledby={`${id}-title`}
          aria-describedby={described ? `${id}-description` : undefined}
          onPointerDown={() => {
            backdropPress.current = false;
          }}
        >
          {dragHandle}
          {children}
        </section>
        {notification && <div className="dialog-notification">{notification}</div>}
      </div>
    </div>
  );
}

function DialogHeader({
  children,
  closeLabel = 'Close dialog',
}: {
  readonly children: ReactNode;
  readonly closeLabel?: string | false;
}): ReactElement {
  const { onOpenChange } = useDialog();
  return (
    <header className="dialog-header">
      <div className="dialog-heading">{children}</div>
      {closeLabel && onOpenChange && (
        <IconButton
          className="dialog-dismiss"
          icon={XIcon}
          variant="ghost"
          size="s"
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
        />
      )}
    </header>
  );
}

function DialogTitle({ className = '', ...props }: ComponentPropsWithRef<'h2'>): ReactElement {
  const { id } = useDialog();
  return <h2 {...props} id={`${id}-title`} className={`dialog-title ${className}`} />;
}

function DialogDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>): ReactElement {
  const { id } = useDialog();
  return <p {...props} id={`${id}-description`} className={`dialog-description ${className}`} />;
}

function DialogBody({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="dialog-body scrollbar-proto">
      <div className="dialog-body-content">{children}</div>
    </div>
  );
}

function DialogFooter({ children }: { readonly children: ReactNode }): ReactElement {
  return <footer className="dialog-footer">{children}</footer>;
}

function DialogClose({ onClick, ...props }: ButtonProps): ReactElement {
  const { onOpenChange } = useDialog();
  return (
    <Button
      variant="secondary"
      tone="neutral"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange?.(false);
        }
      }}
    />
  );
}

export function ModalContent(props: ModalContentProps): ReactElement {
  return <DialogSurface {...props} side="center" />;
}

// The initial side placement is shared with the Folio preview.
export interface DrawerContentProps extends DialogContentProps {
  readonly side?: DrawerSide;
}

export function DrawerContent({ side = 'end', ...props }: DrawerContentProps): ReactElement {
  return <DialogSurface {...props} side={side} />;
}

export {
  DialogRoot as Modal,
  DialogTrigger as ModalTrigger,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
  DialogBody as ModalBody,
  DialogFooter as ModalFooter,
  DialogClose as ModalClose,
  DialogRoot as Drawer,
  DialogTrigger as DrawerTrigger,
  DialogHeader as DrawerHeader,
  DialogTitle as DrawerTitle,
  DialogDescription as DrawerDescription,
  DialogBody as DrawerBody,
  DialogFooter as DrawerFooter,
  DialogClose as DrawerClose,
};

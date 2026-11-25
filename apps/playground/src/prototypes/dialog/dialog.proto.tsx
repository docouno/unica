import { CloseGlyph } from '../control-glyphs.js';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from 'react';
import { Button, IconButton } from '@docouno/unica';
import type { ButtonProps } from '@docouno/unica';
import './dialog.css';

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

type NativeButtonProps = Exclude<ButtonProps, { asChild: true }>;

function DialogTrigger({ onClick, ...props }: Omit<NativeButtonProps, 'ref'>): ReactElement {
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
  readonly 'data-wb-subject'?: '';
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
  readonly layerRef?: RefObject<HTMLDivElement | null>;
}

function observeOverflow(panel: HTMLElement): () => void {
  const body = panel.querySelector<HTMLElement>(':scope > .dialog-body');
  const content = body?.querySelector<HTMLElement>(':scope > .dialog-body-content');
  const header = panel.querySelector<HTMLElement>(':scope > .dialog-header');
  const footer = panel.querySelector<HTMLElement>(':scope > .dialog-footer');
  const handle = panel.querySelector<HTMLElement>(':scope > .dialog-handle');
  const update = (): void => {
    // Measure the available reading area without relying on the current scroll mode.
    const chromeHeight = [header, footer, handle].reduce(
      (height, part) => height + (part?.offsetHeight ?? 0),
      0,
    );
    const padding = getComputedStyle(panel);
    const bodyMargins = body ? getComputedStyle(body) : null;
    const bodyInset = bodyMargins
      ? parseFloat(bodyMargins.marginBlockStart) + parseFloat(bodyMargins.marginBlockEnd)
      : 0;
    const available =
      panel.clientHeight -
      chromeHeight -
      parseFloat(padding.paddingBlockStart) -
      parseFloat(padding.paddingBlockEnd) -
      bodyInset;
    const natural = content?.offsetHeight ?? 0;
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
  const keepFocusVisible = (): void => {
    const active = panel.ownerDocument.activeElement;
    if (!body || !(active instanceof HTMLElement) || !body.contains(active)) {
      return;
    }
    const scrollOwner = panel.hasAttribute('data-whole-scroll') ? panel : body;
    const visible = scrollOwner.getBoundingClientRect();
    const scale = visible.height / scrollOwner.offsetHeight || 1;
    const target = active.getBoundingClientRect();
    if (target.top < visible.top) {
      scrollOwner.scrollTop += (target.top - visible.top) / scale - 4;
    } else if (target.bottom > visible.bottom) {
      scrollOwner.scrollTop += (target.bottom - visible.bottom) / scale + 4;
    }
  };
  const observer = new ResizeObserver((entries) => {
    update();
    if (entries.some(({ target }) => target === panel || target === body)) {
      keepFocusVisible();
    }
  });
  for (const element of [panel, body, content, header, footer, handle]) {
    if (element) {
      observer.observe(element);
    }
  }
  body?.addEventListener('scroll', update, { passive: true });
  update();
  keepFocusVisible();
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
  layerRef,
  children,
  'data-wb-subject': subject,
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
  }, [open, side]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={layerRef}
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
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          backdropPress.current = event.isPrimary && event.button === 0;
        }}
        onPointerCancel={() => {
          backdropPress.current = false;
        }}
        onPointerUp={(event) => {
          const scrim = event.currentTarget;
          // Touch can implicitly capture a release outside the scrim.
          backdropPress.current =
            backdropPress.current &&
            event.isPrimary &&
            scrim.ownerDocument.elementFromPoint(event.clientX, event.clientY) === scrim;
        }}
        onClick={() => {
          // Keep the scrim mounted through the touch's compatibility mouse events.
          const accepted = backdropPress.current;
          backdropPress.current = false;
          if (dismissOnBackdrop && accepted) {
            onOpenChange?.(false);
          }
        }}
      />
      <div className="dialog-placement">
        <section
          ref={panel}
          data-wb-subject={subject}
          className="dialog-surface unica-scrollbar unica-scrollbar--compact"
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
          icon={CloseGlyph}
          variant="ghost"
          size="s"
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
        />
      )}
    </header>
  );
}

function DialogTitle({
  className = '',
  children,
  ...props
}: ComponentPropsWithRef<'h2'>): ReactElement {
  const { id } = useDialog();
  return (
    <h2 {...props} id={`${id}-title`} className={`dialog-title ${className}`}>
      <bdi>{children}</bdi>
    </h2>
  );
}

function DialogDescription({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>): ReactElement {
  const { id } = useDialog();
  return (
    <p {...props} id={`${id}-description`} className={`dialog-description ${className}`}>
      <bdi>{children}</bdi>
    </p>
  );
}

function DialogBody({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="dialog-body unica-scrollbar unica-scrollbar--compact">
      <div className="dialog-body-content">{children}</div>
    </div>
  );
}

function DialogFooter({ children }: { readonly children: ReactNode }): ReactElement {
  return <footer className="dialog-footer">{children}</footer>;
}

function DialogClose({ onClick, ...props }: NativeButtonProps): ReactElement {
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

interface DragSession {
  readonly pointerId: number;
  readonly start: number;
  readonly scale: number;
  readonly time: number;
  readonly panel: HTMLElement;
  readonly layer: HTMLElement;
}

function DrawerHandle(): ReactElement {
  const { onOpenChange } = useDialog();
  const sessionRef = useRef<DragSession | null>(null);
  const reset = useCallback((): void => {
    const session = sessionRef.current;
    if (session) {
      session.layer.removeAttribute('data-dragging');
      session.layer.style.removeProperty('--drawer-drag-distance');
      session.layer.style.removeProperty('--drawer-drag-scrim');
      sessionRef.current = null;
    }
  }, []);
  useLayoutEffect(() => reset, [reset]);

  return (
    <div
      className="dialog-handle"
      aria-hidden="true"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) {
          return;
        }
        const panel = event.currentTarget.closest<HTMLElement>('.dialog-surface');
        const layer = panel?.closest<HTMLElement>('.dialog-layer');
        if (!panel || !layer) {
          return;
        }
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        sessionRef.current = {
          pointerId: event.pointerId,
          start: event.clientY,
          scale: panel.getBoundingClientRect().height / panel.offsetHeight || 1,
          time: event.timeStamp,
          panel,
          layer,
        };
        layer.setAttribute('data-dragging', '');
      }}
      onPointerMove={(event) => {
        const session = sessionRef.current;
        if (!session || session.pointerId !== event.pointerId) {
          return;
        }
        const distance = Math.max(0, (event.clientY - session.start) / session.scale);
        const minimumOpacity = 0.45;
        const opacity = Math.max(minimumOpacity, 1 - distance / session.panel.offsetHeight);
        session.layer.style.setProperty('--drawer-drag-distance', `${distance}px`);
        session.layer.style.setProperty('--drawer-drag-scrim', String(opacity));
      }}
      onPointerUp={(event) => {
        const session = sessionRef.current;
        if (!session || session.pointerId !== event.pointerId) {
          return;
        }
        const distance = (event.clientY - session.start) / session.scale;
        const threshold = Math.min(120, session.panel.offsetHeight * 0.3);
        const velocity = distance / Math.max(1, event.timeStamp - session.time);
        reset();
        if (distance >= threshold || (distance >= 32 && velocity >= 0.55)) {
          onOpenChange?.(false);
        }
      }}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <span />
    </div>
  );
}

export interface DrawerContentProps extends DialogContentProps {
  readonly side?: DrawerSide | { readonly narrow: DrawerSide; readonly wide: DrawerSide };
  readonly swipeToClose?: boolean;
}

export function DrawerContent({
  side = 'end',
  swipeToClose = true,
  ...props
}: DrawerContentProps): ReactElement {
  const { open, onOpenChange } = useDialog();
  const layerRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const adaptive = typeof side !== 'string';
  useLayoutEffect(() => {
    const canvas = layerRef.current?.parentElement;
    if (!open || !adaptive || !canvas) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setNarrow(entry.contentRect.width <= 600);
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [adaptive, open]);

  const edge = typeof side === 'string' ? side : narrow ? side.narrow : side.wide;
  return (
    <DialogSurface
      {...props}
      side={edge}
      layerRef={layerRef}
      dragHandle={edge === 'bottom' && swipeToClose && onOpenChange && <DrawerHandle />}
    />
  );
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

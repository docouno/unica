import { createContext, use, useCallback, useId, useMemo, useRef, useState } from 'react';
import type { DOMAttributes, MouseEvent, ReactElement, Ref } from 'react';
import { Slot, requireSlotChild, resolveSlotProps } from '../../core/Slot.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { guardActivation } from '../../core/guardActivation.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CloseGlyph } from '../../internal/glyphs/index.js';
import { PopoverController } from './controller.js';
import type { PopoverView } from './controller.js';
import { canUseTrigger } from './interaction.js';
import type {
  PopoverBodyProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from './types.js';
import './popover.css';

interface RootContext extends PopoverView {
  readonly controller: PopoverController;
  readonly fallbackId: string;
  readonly panelRef: Ref<HTMLDivElement> | undefined;
}

const PopoverContext = createContext<RootContext | null>(null);

function usePopover(part: string): RootContext {
  const context = use(PopoverContext);
  if (!context) {
    throw new Error(`Popover${part} must be used within Popover.`);
  }
  return context;
}

/** Owns the requested visibility and native lifecycle of an in-place non-modal dialog. */
export function Popover({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  ref,
}: PopoverProps): ReactElement {
  const fallbackId = useId();
  const parent = use(PopoverContext);
  const insideParentContent = use(LabelContext) !== null;
  const [requested, { read, propose }] = useStateAuthority({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // Explicit IDs may be supplied by Content anywhere in the tree. Publish the
  // relationship after its ref resolves so the closed SSR trigger never points at a missing ID.
  const [view, setView] = useState<PopoverView>({ phase: 'closed', contentId: undefined });
  const [controller] = useState(() => new PopoverController(read, propose, setView));

  useIsoLayoutEffect(() => controller.start(), [controller]);
  useIsoLayoutEffect(() =>
    controller.commit(view.phase, requested, insideParentContent && parent?.phase === 'preparing'),
  );

  const context = useMemo(
    () => ({ ...view, controller, fallbackId, panelRef: ref }),
    [view, controller, fallbackId, ref],
  );
  return <PopoverContext value={context}>{children}</PopoverContext>;
}

/** Opens and toggles its Popover through a button or a composed native source. */
export function PopoverTrigger(props: PopoverTriggerProps): ReactElement {
  const { controller, contentId, phase } = usePopover('Trigger');
  const {
    asChild,
    className,
    children,
    disabled,
    onAuxClick,
    onClick,
    onPointerDown,
    onPointerCancel,
    onKeyDown,
    ref,
    ...nativeProps
  } = props;
  const pointerType = useRef<string | undefined>(undefined);
  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    const pointer = pointerType.current;
    pointerType.current = undefined;
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (!event.defaultPrevented) {
      // The union contains the matching handler for either rendering path.
      (onClick as typeof handleClick | undefined)?.(event);
      controller.activate(event, event.currentTarget, pointer);
    }
  };
  const binding = {
    'aria-controls': contentId,
    'aria-expanded': phase === 'open',
    'aria-haspopup': 'dialog',
  } as const;
  const interaction = {
    className: cx('unica-popover-trigger', className),
    onAuxClick: composeEventHandlers(
      onAuxClick as React.MouseEventHandler<HTMLElement> | undefined,
      (event: MouseEvent<HTMLElement>) => {
        if (disabled || !canUseTrigger(event.currentTarget)) {
          event.preventDefault();
        }
      },
    ),
    onClick: handleClick,
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      const handler: React.PointerEventHandler<HTMLElement> | undefined = onPointerDown;
      handler?.(event);
      if (!event.defaultPrevented) {
        pointerType.current = event.pointerType;
      }
    },
    onPointerCancel(event: React.PointerEvent<HTMLElement>) {
      pointerType.current = undefined;
      const handler: React.PointerEventHandler<HTMLElement> | undefined = onPointerCancel;
      handler?.(event);
    },
    onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
      pointerType.current = undefined;
      const handler: React.KeyboardEventHandler<HTMLElement> | undefined = onKeyDown;
      handler?.(event);
    },
  };
  const triggerRef = useMemo(() => mergeRefs(controller.addTrigger, ref), [controller, ref]);
  const activationProps = { ...nativeProps, onAuxClick, onClick, onKeyDown, onPointerDown };
  if (asChild) {
    const child = requireSlotChild<HTMLElement>(children, 'PopoverTrigger');
    const directButton = child.type === 'button';
    const unavailable = disabled
      ? {
          'aria-disabled': true,
          ...(directButton || typeof child.type !== 'string' ? { disabled } : undefined),
          ...(child.type === 'a'
            ? {
                href: undefined,
                role: child.props.role ?? nativeProps.role ?? 'link',
                tabIndex: undefined,
              }
            : undefined),
          ...guardActivation(
            resolveSlotProps({
              slotProps: activationProps,
              childProps: child.props,
            }) as DOMAttributes<HTMLElement>,
            () => true,
          ),
        }
      : undefined;
    return (
      <Slot
        {...nativeProps}
        {...interaction}
        ref={triggerRef}
        slotOwned={{
          ...binding,
          popoverTarget: undefined,
          popoverTargetAction: undefined,
          command: undefined,
          commandfor: undefined,
          ...(Object.hasOwn(child.props, 'commandFor') ? { commandFor: undefined } : undefined),
          ...(directButton ? { type: 'button' } : undefined),
          ...unavailable,
        }}
      >
        {child}
      </Slot>
    );
  }
  return (
    <button
      {...nativeProps}
      {...interaction}
      {...(disabled
        ? guardActivation(activationProps as DOMAttributes<HTMLElement>, () => true)
        : undefined)}
      {...binding}
      type="button"
      disabled={disabled}
      ref={triggerRef}
    >
      {children}
    </button>
  );
}

type LabelKind = 'title' | 'description';

interface Labels {
  readonly attach: (kind: LabelKind, node: HTMLElement, id: string) => () => void;
  readonly update: (element: HTMLDivElement, labels: AuthoredLabels) => void;
}

interface AuthoredLabels {
  readonly labelledBy: string | undefined;
  readonly label: string | undefined;
  readonly describedBy: string | undefined;
}

const LabelContext = createContext<Labels | null>(null);

function createLabels(): Labels {
  const titles = new Map<HTMLElement, string>();
  const descriptions = new Map<HTMLElement, string>();
  let panel: HTMLDivElement | undefined;
  let authored: AuthoredLabels | undefined;
  const sync = (): void => {
    if (!panel || !authored) {
      return;
    }
    const { labelledBy, label, describedBy } = authored;
    const title = titles.values().next().value;
    const description = descriptions.values().next().value;
    const setIdList = (attribute: string, value: string | undefined): void => {
      if (value) {
        panel?.setAttribute(attribute, value);
      } else {
        panel?.removeAttribute(attribute);
      }
    };
    setIdList('aria-labelledby', labelledBy?.trim() || (label?.trim() ? undefined : title));
    const descriptionsList = new Set(describedBy?.trim().split(/\s+/).filter(Boolean));
    if (description) {
      descriptionsList.add(description);
    }
    setIdList('aria-describedby', [...descriptionsList].join(' '));
  };
  return {
    attach(kind, node, id) {
      const entries = kind === 'title' ? titles : descriptions;
      entries.set(node, id);
      if (entries.size > 1) {
        warnOnce(
          `popover-${kind}-count`,
          `PopoverContent expects at most one Popover${kind === 'title' ? 'Title' : 'Description'}.`,
        );
      }
      sync();
      return () => {
        entries.delete(node);
        sync();
      };
    },
    update(element, labels) {
      panel = element;
      authored = labels;
      sync();
    },
  };
}

/** Native top-layer carrier for a named, non-modal dialog and its content. */
export function PopoverContent({
  id,
  size = 'm',
  side = 'bottom',
  align = 'center',
  className,
  children,
  ref,
  'aria-labelledby': labelledBy,
  'aria-label': label,
  'aria-describedby': describedBy,
  ...nativeProps
}: PopoverContentProps): ReactElement {
  const { controller, fallbackId, phase, panelRef } = usePopover('Content');
  const [labels] = useState(createLabels);
  const panel = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(
    () => mergeRefs(controller.addContent, panel, panelRef, ref),
    [controller, panelRef, ref],
  );
  useIsoLayoutEffect(() => {
    if (panel.current) {
      labels.update(panel.current, { labelledBy, label, describedBy });
      controller.updateContent(panel.current, { side, align });
    }
  });

  return (
    <div
      {...nativeProps}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cx(
        'unica-popover unica-overlay-surface unica-scrollbar unica-scrollbar--compact',
        className,
      )}
      data-surface="overlay"
      data-unica-popover-size={size}
      id={id ?? fallbackId}
      popover="auto"
      ref={mergedRef}
      role="dialog"
      tabIndex={-1}
    >
      {phase !== 'closed' && (
        <div className="unica-popover-inner" inert={phase === 'preparing'}>
          <LabelContext value={labels}>{children}</LabelContext>
        </div>
      )}
    </div>
  );
}

/** Keeps the heading, description, and close action together above the scrolling body. */
export function PopoverHeader({ className, ...props }: PopoverHeaderProps): ReactElement {
  return <div {...props} className={cx('unica-popover-header', className)} />;
}

/** Scrollable content area between the panel's stationary header and footer. */
export function PopoverBody({ className, ...props }: PopoverBodyProps): ReactElement {
  return (
    <div
      {...props}
      className={cx('unica-popover-body unica-scrollbar unica-scrollbar--compact', className)}
    />
  );
}

/** Wraps contextual actions in source order at the bottom of the panel. */
export function PopoverFooter({ className, ...props }: PopoverFooterProps): ReactElement {
  return <div {...props} className={cx('unica-popover-footer', className)} />;
}

function useLabelRef<T extends HTMLElement>(
  kind: LabelKind,
  id: string,
  ref: Ref<T> | undefined,
): React.RefCallback<T> {
  const labels = use(LabelContext);
  if (!labels) {
    throw new Error(
      `Popover${kind === 'title' ? 'Title' : 'Description'} must be used within PopoverContent.`,
    );
  }
  const register = useCallback((node: T) => labels.attach(kind, node, id), [kind, labels, id]);
  return useMemo(() => mergeRefs(register, ref), [register, ref]);
}

/** Visible heading that supplies the dialog name when no explicit name is provided. */
export function PopoverTitle({
  as: Heading = 'h3',
  className,
  id,
  ref,
  ...props
}: PopoverTitleProps): ReactElement {
  const generatedId = useId();
  const labelId = id ?? generatedId;
  const mergedRef = useLabelRef('title', labelId, ref);
  return (
    <Heading
      {...props}
      className={cx('unica-popover-title', className)}
      id={labelId}
      ref={mergedRef}
    />
  );
}

/** Brief visible description announced in addition to any author-supplied descriptions. */
export function PopoverDescription({
  className,
  id,
  ref,
  ...props
}: PopoverDescriptionProps): ReactElement {
  const generatedId = useId();
  const labelId = id ?? generatedId;
  const mergedRef = useLabelRef('description', labelId, ref);
  return (
    <p
      {...props}
      className={cx('unica-popover-description', className)}
      id={labelId}
      ref={mergedRef}
    />
  );
}

/** Visible, localizable native button that requests closing its Popover. */
export function PopoverClose({
  'aria-label': label = 'Close popover',
  className,
  onClick,
  ...props
}: PopoverCloseProps): ReactElement {
  const { controller } = usePopover('Close');
  return (
    <button
      {...props}
      aria-label={label}
      className={cx('unica-popover-close', className)}
      onClick={composeEventHandlers(onClick, controller.requestClose)}
      type="button"
    >
      <CloseGlyph />
    </button>
  );
}

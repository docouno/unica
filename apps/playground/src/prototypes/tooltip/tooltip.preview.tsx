import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, RefCallback } from 'react';
import { HoverCard, Tooltip } from './tooltip.proto.js';
import type { HintAlign, HintSide } from './tooltip.proto.js';
import './tooltip.examples.css';

export interface HintTriggerBindings extends HTMLAttributes<HTMLElement> {
  readonly ref: RefCallback<HTMLElement>;
}

export interface HintPreviewProps {
  readonly family?: 'tooltip' | 'hover-card';
  readonly side?: HintSide;
  readonly align?: HintAlign;
  readonly shortcut?: ReactNode;
  readonly description?: string;
  readonly children: ReactNode;
  readonly trigger: (bindings: HintTriggerBindings) => ReactElement;
}

const openedEvent = 'hint-design-preview:open';
const warm = new WeakMap<Document, Partial<Record<'tooltip' | 'hover-card', number>>>();

// Keep the rendered control's identity while its local result changes.
function PreviewTrigger({
  render,
  bindings,
}: {
  readonly render: HintPreviewProps['trigger'];
  readonly bindings: HintTriggerBindings;
}): ReactElement {
  return render(bindings);
}

function PointerBridge(): ReactElement {
  return (
    <span className="hint-preview-bridge" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

// Local design harness: enough intent, selection and native top-layer behavior to
// judge the experience. This is not the reusable library overlay engine.
export function HintPreview({
  family = 'tooltip',
  side = family === 'tooltip' ? 'top' : 'bottom',
  align = family === 'tooltip' ? 'center' : 'start',
  shortcut,
  description,
  children,
  trigger,
}: HintPreviewProps): ReactElement {
  const id = useId();
  const source = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLSpanElement & HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intent = useRef({
    source: false,
    panel: false,
    focus: false,
    dismissed: false,
    touch: false,
    drag: false,
  });
  const [open, setOpen] = useState(false);

  function clear(): void {
    clearTimeout(timer.current);
  }
  function hide(): void {
    clear();
    setOpen(false);
  }
  function dismiss(): void {
    intent.current.dismissed = true;
    intent.current.panel = false;
    hide();
  }
  function show(): void {
    clear();
    const anchor = source.current;
    if (
      !anchor ||
      anchor.matches(':disabled, [aria-disabled="true"]') ||
      intent.current.dismissed
    ) {
      return;
    }
    anchor.ownerDocument.dispatchEvent(new CustomEvent(openedEvent, { detail: anchor }));
    setOpen(true);
  }
  function leave(): void {
    clear();
    const current = intent.current;
    if (current.source || current.panel || current.focus || current.drag) {
      return;
    }
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && panel.current?.contains(selection.anchorNode)) {
      return;
    }
    current.dismissed = false;
    timer.current = setTimeout(hide, 150);
  }

  useEffect(() => {
    function another(event: Event): void {
      if (event instanceof CustomEvent && event.detail !== source.current) {
        clearTimeout(timer.current);
        intent.current.panel = false;
        setOpen(false);
      }
    }
    document.addEventListener(openedEvent, another);
    return () => {
      document.removeEventListener(openedEvent, another);
      clearTimeout(timer.current);
    };
  }, []);

  useLayoutEffect(() => {
    const anchor = source.current;
    const popup = panel.current;
    if (!open || !anchor || !popup) {
      return;
    }
    const doc = anchor.ownerDocument;
    const activeTimings = warm.get(doc) ?? {};
    activeTimings[family] = Infinity;
    warm.set(doc, activeTimings);
    function position(): void {
      if (!anchor || !popup) {
        return;
      }
      const body = popup.querySelector<HTMLElement>('.tooltip-body-proto, .hover-card-body-proto');
      const scrollTop = body?.scrollTop ?? 0;
      const target = anchor.getBoundingClientRect();
      const bounds = anchor.closest('[data-hint-bounds]')?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const left = Math.max(16, bounds ? bounds.left + 16 : 16);
      const right = Math.min(
        doc.documentElement.clientWidth - 16,
        bounds ? bounds.right - 16 : Infinity,
      );
      const top = Math.max(viewportTop + 16, bounds ? bounds.top + 16 : 16);
      const bottom = Math.min(viewportBottom - 16, bounds ? bounds.bottom - 16 : Infinity);
      if (
        !anchor.isConnected ||
        target.bottom < top ||
        target.top > bottom ||
        target.right < left ||
        target.left > right
      ) {
        setOpen(false);
        return;
      }
      popup.style.maxWidth = `${Math.max(0, Math.min(family === 'tooltip' ? 320 : 352, right - left))}px`;
      const rtl = getComputedStyle(anchor).direction === 'rtl';
      let physical: 'left' | 'right' | 'top' | 'bottom' =
        side === 'start'
          ? rtl
            ? 'right'
            : 'left'
          : side === 'end'
            ? rtl
              ? 'left'
              : 'right'
            : side;
      popup.style.maxHeight = 'none';
      const natural = popup.getBoundingClientRect();
      const room = {
        top: target.top - top - 8,
        bottom: bottom - target.bottom - 8,
        left: target.left - left - 8,
        right: right - target.right - 8,
      };
      if ((physical === 'left' || physical === 'right') && room[physical] < natural.width) {
        const other = physical === 'left' ? 'right' : 'left';
        physical = room[other] >= natural.width ? other : 'bottom';
      }
      if (physical === 'top' || physical === 'bottom') {
        const other = physical === 'top' ? 'bottom' : 'top';
        if (room[physical] < natural.height && room[other] > room[physical]) {
          physical = other;
        }
      }
      // Previews contain short summaries. A scroll escape is only for constrained height.
      const availableHeight = Math.max(
        48,
        physical === 'top' || physical === 'bottom' ? room[physical] : bottom - top,
      );
      popup.style.maxHeight = `${availableHeight}px`;
      const actual = popup.getBoundingClientRect();
      // The pointer bridge extends outside the surface; it is not content overflow.
      popup.dataset.constrained = String(natural.height > availableHeight + 1);
      if (body) {
        body.scrollTop = scrollTop;
      }
      const factor = align === 'center' ? 0.5 : align === 'start' ? 0 : 1;
      const x =
        physical === 'left'
          ? target.left - actual.width - 8
          : physical === 'right'
            ? target.right + 8
            : target.left + (target.width - actual.width) * (rtl ? 1 - factor : factor);
      const y =
        physical === 'top'
          ? target.top - actual.height - 8
          : physical === 'bottom'
            ? target.bottom + 8
            : target.top + (target.height - actual.height) * factor;
      popup.style.left = `${Math.max(left, Math.min(x, right - actual.width))}px`;
      popup.style.top = `${Math.max(top, Math.min(y, bottom - actual.height))}px`;
      popup.dataset.placed =
        physical === 'left'
          ? rtl
            ? 'end'
            : 'start'
          : physical === 'right'
            ? rtl
              ? 'start'
              : 'end'
            : physical;
      popup.style.visibility = 'visible';
    }
    function keyboard(event: KeyboardEvent): void {
      if (event.key !== 'Escape' && event.key !== 'Tab') {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      // The preview owns no focus. Explicit keyboard navigation ends it even
      // after pointer selection has moved focus from the source to the document.
      clearTimeout(timer.current);
      intent.current.dismissed = true;
      intent.current.panel = false;
      setOpen(false);
    }
    function outside(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        !anchor?.contains(event.target) &&
        !popup?.contains(event.target)
      ) {
        intent.current.dismissed = true;
        setOpen(false);
      }
    }
    function selectionEnded(): void {
      intent.current.drag = false;
      const current = intent.current;
      const selection = window.getSelection();
      if (
        !current.source &&
        !current.panel &&
        !current.focus &&
        (!selection || selection.isCollapsed || !popup?.contains(selection.anchorNode))
      ) {
        current.dismissed = false;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpen(false), 150);
      }
    }
    popup.showPopover();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(anchor);
    const bounds = anchor.closest('[data-hint-bounds]');
    if (bounds) {
      observer.observe(bounds);
    }
    function outsideScroll(event: Event): void {
      if (event.target instanceof Node && popup?.contains(event.target)) {
        return;
      }
      position();
    }
    doc.addEventListener('keydown', keyboard, true);
    doc.addEventListener('pointerdown', outside, true);
    doc.addEventListener('pointerup', selectionEnded);
    doc.addEventListener('selectionchange', selectionEnded);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', outsideScroll, true);
    viewportListener('addEventListener');
    function viewportListener(method: 'addEventListener' | 'removeEventListener'): void {
      window.visualViewport?.[method]('resize', position);
    }
    return () => {
      const timings = warm.get(doc) ?? {};
      timings[family] = performance.now();
      warm.set(doc, timings);
      observer.disconnect();
      doc.removeEventListener('keydown', keyboard, true);
      doc.removeEventListener('pointerdown', outside, true);
      doc.removeEventListener('pointerup', selectionEnded);
      doc.removeEventListener('selectionchange', selectionEnded);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', outsideScroll, true);
      viewportListener('removeEventListener');
      if (popup.matches(':popover-open')) {
        popup.hidePopover();
      }
    };
  }, [open, side, align, family]);

  const bindings: HintTriggerBindings = {
    ref: (element) => {
      source.current = element;
    },
    'aria-describedby': description ? id : undefined,
    onPointerEnter: (event) => {
      if (event.pointerType === 'touch') {
        return;
      }
      intent.current.source = true;
      clear();
      const last = warm.get(event.currentTarget.ownerDocument)?.[family] ?? -Infinity;
      timer.current = setTimeout(show, performance.now() - last < 300 ? 0 : 600);
    },
    onPointerLeave: () => {
      intent.current.source = false;
      leave();
    },
    onPointerDown: (event) => {
      intent.current.touch = event.pointerType === 'touch';
      dismiss();
    },
    onClick: dismiss,
    onFocus: (event) => {
      intent.current.focus = true;
      if (!intent.current.touch && event.currentTarget.matches(':focus-visible')) {
        intent.current.dismissed = false;
        show();
      }
    },
    onBlur: () => {
      intent.current.focus = false;
      intent.current.touch = false;
      // Starting pointer selection can blur the source. Continue reading the
      // hovered panel; an explicit Tab departure is handled at the document.
      if (intent.current.panel || intent.current.drag) {
        leave();
        return;
      }
      intent.current.dismissed = false;
      hide();
    },
  };
  const shared: HTMLAttributes<HTMLDivElement & HTMLSpanElement> = {
    className: 'hint-preview-panel',
    'aria-hidden': true,
    onPointerEnter: () => {
      intent.current.panel = true;
      clear();
    },
    onPointerLeave: () => {
      intent.current.panel = false;
      leave();
    },
    onPointerDown: () => {
      intent.current.drag = true;
    },
  };
  return (
    <>
      <PreviewTrigger render={trigger} bindings={bindings} />
      {description && (
        <span id={id} className="hint-demo-sr">
          {description}
        </span>
      )}
      {open &&
        (family === 'tooltip' ? (
          <Tooltip
            ref={panel}
            popover="manual"
            {...shared}
            shortcut={shortcut}
            previewBridge={<PointerBridge />}
          >
            {children}
          </Tooltip>
        ) : (
          <HoverCard ref={panel} popover="manual" {...shared} previewBridge={<PointerBridge />}>
            {children}
          </HoverCard>
        ))}
    </>
  );
}

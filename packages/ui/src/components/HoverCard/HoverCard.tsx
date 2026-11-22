import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactElement, RefCallback } from 'react';
import { Slot, requireSlotChild } from '../../core/Slot.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { previewSurfaceProps } from '../../core/hover-preview/surface.js';
import { usePreview, usePreviewElement } from '../../core/hover-preview/usePreview.js';
import type { PreviewBindings } from '../../core/hover-preview/usePreview.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import type { Align, Side } from '../../core/overlay/positioning.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps } from './types.js';
import '../../internal/hover-preview.css';
import './hover-card.css';

interface Placement {
  readonly side: Side;
  readonly align: Align;
}

interface HoverCardScope extends PreviewBindings {
  readonly anchorRef: RefCallback<HTMLAnchorElement>;
  readonly carrierRef: RefCallback<HTMLDivElement>;
  readonly setPlacement: (placement: Placement) => void;
}

const HoverCardContext = createContext<HoverCardScope | null>(null);
const defaultPlacement: Placement = { side: 'bottom', align: 'start' };

function useHoverCard(part: string): HoverCardScope {
  const scope = useContext(HoverCardContext);
  if (!scope) {
    throw new Error(`HoverCard${part} must be used inside HoverCard.`);
  }
  return scope;
}

/** Coordinate a link and its optional read-only preview. */
export function HoverCard({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: HoverCardProps): ReactElement {
  const [anchor, anchorRef] = usePreviewElement<HTMLAnchorElement>();
  const [carrier, carrierRef, carrierNode] = usePreviewElement<HTMLDivElement>();
  const [placement, setPlacement] = useState(defaultPlacement);
  const preview = usePreview({
    family: 'hover-card',
    external: false,
    anchor,
    carrier,
    carrierNode,
    avoid: null,
    disabled: false,
    ...placement,
    padding: 16,
    open,
    defaultOpen,
    onOpenChange,
  });
  return (
    <HoverCardContext value={{ ...preview, anchorRef, carrierRef, setPlacement }}>
      {children}
    </HoverCardContext>
  );
}

/** Preserve the link's navigation and attach hover and keyboard-focus intent. */
export function HoverCardTrigger({
  asChild,
  href,
  children,
  ref,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onClick,
  onAuxClick,
  ...props
}: HoverCardTriggerProps): ReactElement {
  const { trigger, anchorRef } = useHoverCard('Trigger');
  const mergedRef = useMemo(() => mergeRefs(ref, anchorRef), [ref, anchorRef]);
  const handlers = {
    onFocus: composeEventHandlers(onFocus, trigger.onFocus),
    onBlur: composeEventHandlers(onBlur, trigger.onBlur),
    onPointerEnter: composeEventHandlers(onPointerEnter, trigger.onPointerEnter),
    onPointerLeave: composeEventHandlers(onPointerLeave, trigger.onPointerLeave),
    onClick: composeEventHandlers(onClick, trigger.onClick),
    onAuxClick: composeEventHandlers(onAuxClick, trigger.onAuxClick),
  };
  if (asChild) {
    const child = requireSlotChild<HTMLAnchorElement>(children, 'HoverCardTrigger asChild');
    if (typeof child.type === 'string' && child.type !== 'a') {
      throw new Error(
        'HoverCardTrigger asChild requires an anchor or a component that renders one.',
      );
    }
    if (
      child.type === 'a' &&
      typeof child.props.href !== 'string' &&
      child.props['aria-disabled'] !== true &&
      child.props['aria-disabled'] !== 'true'
    ) {
      throw new Error('An enabled HoverCardTrigger anchor requires a string href.');
    }
    return (
      <Slot<HTMLAnchorElement> {...props} {...handlers} ref={mergedRef}>
        {child}
      </Slot>
    );
  }
  if (typeof href !== 'string') {
    throw new Error('HoverCardTrigger requires a string href.');
  }
  return (
    <a {...props} {...handlers} href={href} ref={mergedRef}>
      {children}
    </a>
  );
}

/** Provide passive, selectable content in the link's visual preview. */
export function HoverCardContent({
  children,
  side = defaultPlacement.side,
  align = defaultPlacement.align,
  ref,
  className,
  onPointerEnter,
  onPointerLeave,
  ...props
}: HoverCardContentProps): ReactElement {
  const { carrier, carrierRef, setPlacement } = useHoverCard('Content');
  const mergedRef = useMemo(() => mergeRefs(ref, carrierRef), [ref, carrierRef]);
  useIsoLayoutEffect(() => {
    setPlacement({ side, align });
  }, [side, align, setPlacement]);
  return (
    <div
      {...previewSurfaceProps(props)}
      className={cx('unica-hover-card', className)}
      ref={mergedRef}
      aria-hidden="true"
      popover="manual"
      contentEditable={false}
      data-surface="overlay"
      onPointerEnter={composeEventHandlers(onPointerEnter, carrier.onPointerEnter)}
      onPointerLeave={composeEventHandlers(onPointerLeave, carrier.onPointerLeave)}
    >
      <div
        className="unica-hover-card-reading-area unica-scrollbar unica-scrollbar--compact"
        data-unica-preview-scroll=""
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

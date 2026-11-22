import { useId, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Slot, requireSlotChild } from '../../core/Slot.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { DescriptionFallback, DescriptionScope, descriptionIds } from '../../core/description.js';
import {
  DEFAULT_PREVIEW_DELAY,
  PreviewDomainContext,
  nonnegative,
} from '../../core/hover-preview/domain.js';
import { previewSurfaceProps } from '../../core/hover-preview/surface.js';
import { usePreview, usePreviewElement } from '../../core/hover-preview/usePreview.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { Kbd } from '../Kbd/index.js';
import type { TooltipProps, TooltipProviderProps } from './types.js';
import '../../internal/hover-preview.css';
import './tooltip.css';

/** Set the cold hover delay and scope of the preview warmup clocks. */
export function TooltipProvider({ children, delay }: TooltipProviderProps): ReactElement {
  const [scope] = useState(() => ({}));
  const token = useMemo(
    () => ({ scope, delay: nonnegative(delay, DEFAULT_PREVIEW_DELAY) }),
    [scope, delay],
  );
  return <PreviewDomainContext value={token}>{children}</PreviewDomainContext>;
}

/** Show a short visual hint with optional supplemental accessible text. */
export function Tooltip({
  label,
  shortcut,
  describe = false,
  anchor: externalAnchor,
  avoid = null,
  children,
  disabled = false,
  open,
  defaultOpen,
  onOpenChange,
  side = 'top',
  align = 'center',
  collisionPadding,
  ref,
  className,
  onPointerEnter,
  onPointerLeave,
  ...surfaceProps
}: TooltipProps): ReactElement {
  const id = useId();
  const fallbackId = `${id}-fallback`;
  const scope = useMemo(() => ({ id, fallbackId }), [id, fallbackId]);
  const external = externalAnchor !== undefined;
  const child = external ? undefined : requireSlotChild<HTMLElement>(children, 'Tooltip');
  const [trigger, triggerRef] = usePreviewElement<HTMLElement>();
  const [carrier, carrierRef, carrierNode] = usePreviewElement<HTMLSpanElement>();
  const surfaceRef = useMemo(() => mergeRefs(ref, carrierRef), [ref, carrierRef]);
  const hasLabel = Boolean(label.trim());
  const preview = usePreview({
    family: 'tooltip',
    external,
    anchor: external ? externalAnchor : trigger,
    carrier,
    carrierNode,
    avoid,
    disabled: disabled || !hasLabel,
    side,
    align,
    padding: nonnegative(collisionPadding, 16),
    open,
    defaultOpen,
    onOpenChange,
  });

  const sourceDescription = child && hasLabel && describe ? child.props : undefined;

  return (
    <>
      {child && (
        <DescriptionScope value={sourceDescription ? scope : null}>
          <Slot
            {...(hasLabel ? preview.trigger : undefined)}
            ref={triggerRef}
            aria-describedby={sourceDescription ? `${fallbackId} ${id}` : undefined}
          >
            {child}
          </Slot>
        </DescriptionScope>
      )}
      {sourceDescription && (
        <>
          <DescriptionFallback
            id={fallbackId}
            trigger={trigger}
            authorIds={descriptionIds(sourceDescription['aria-describedby'])}
            authorDescription={sourceDescription['aria-description']}
            title={sourceDescription.title}
            hasExplicitName={Boolean(sourceDescription['aria-label']?.trim())}
            label={sourceDescription.children}
            source={child}
            nameIds={descriptionIds(sourceDescription['aria-labelledby'])}
          />
          <span id={id} hidden>
            {label}
          </span>
        </>
      )}
      {hasLabel && (
        <span
          {...previewSurfaceProps(surfaceProps)}
          className={cx('unica-tooltip', className)}
          ref={surfaceRef}
          role="tooltip"
          aria-hidden="true"
          popover="manual"
          contentEditable={false}
          data-surface="overlay"
          onPointerEnter={composeEventHandlers(onPointerEnter, preview.carrier.onPointerEnter)}
          onPointerLeave={composeEventHandlers(onPointerLeave, preview.carrier.onPointerLeave)}
        >
          <span
            className="unica-tooltip-body unica-scrollbar unica-scrollbar--compact"
            data-unica-preview-scroll=""
            tabIndex={-1}
          >
            <bdi className="unica-tooltip-label" dir="auto">
              {label}
            </bdi>
            {shortcut && (
              <span className="unica-tooltip-shortcut" dir="ltr">
                {typeof shortcut === 'string' ? <Kbd>{shortcut}</Kbd> : shortcut}
              </span>
            )}
          </span>
        </span>
      )}
    </>
  );
}

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Kbd } from '@docouno/unica';
import './tooltip.css';

export type HintSide = 'top' | 'bottom' | 'start' | 'end';
export type HintAlign = 'start' | 'center' | 'end';

export interface TooltipProps extends ComponentPropsWithRef<'span'> {
  readonly shortcut?: ReactNode;
  /** Pointer-only design-harness decoration; not a proposed public slot. */
  readonly previewBridge?: ReactNode;
}

// Visual surfaces; intent and placement are demonstrated by the separate preview harness.
// These props are not the shipped library API.
export function Tooltip({
  shortcut,
  previewBridge,
  children,
  className = '',
  ...props
}: TooltipProps): ReactElement | null {
  if (
    children === null ||
    children === undefined ||
    children === false ||
    (typeof children === 'string' && !children.trim())
  ) {
    return null;
  }
  return (
    <span {...props} role="tooltip" data-surface="overlay" className={`tooltip-proto ${className}`}>
      <span className="tooltip-body-proto unica-scrollbar unica-scrollbar--compact">
        <span className="tooltip-label-proto" dir="auto">
          {children}
        </span>
        {shortcut && (
          <span className="tooltip-shortcut-proto">
            {typeof shortcut === 'string' ? <Kbd>{shortcut}</Kbd> : shortcut}
          </span>
        )}
      </span>
      {previewBridge}
    </span>
  );
}

export interface HoverCardProps extends ComponentPropsWithRef<'div'> {
  readonly children: ReactNode;
  /** Pointer-only design-harness decoration; not a proposed public slot. */
  readonly previewBridge?: ReactNode;
}

export function HoverCard({
  className = '',
  children,
  previewBridge,
  ...props
}: HoverCardProps): ReactElement {
  return (
    <div {...props} data-surface="overlay" className={`hover-card-proto ${className}`}>
      <div className="hover-card-body-proto unica-scrollbar unica-scrollbar--compact">
        {children}
      </div>
      {previewBridge}
    </div>
  );
}

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Kbd } from '../kbd/kbd.proto.js';
import './tooltip.css';

export type HintSide = 'top' | 'bottom' | 'start' | 'end';
export type HintAlign = 'start' | 'center' | 'end';

export interface TooltipProps extends ComponentPropsWithRef<'span'> {
  readonly shortcut?: ReactNode;
}

// Visual surfaces; intent and placement are demonstrated by the separate preview harness.
// These props are not the shipped library API.
export function Tooltip({
  shortcut,
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
      <span className="tooltip-label-proto" dir="auto">
        {children}
      </span>
      {shortcut && (
        <span className="tooltip-shortcut-proto">
          {typeof shortcut === 'string' ? <Kbd>{shortcut}</Kbd> : shortcut}
        </span>
      )}
    </span>
  );
}

export interface HoverCardProps extends ComponentPropsWithRef<'div'> {
  readonly children: ReactNode;
}

export function HoverCard({ className = '', ...props }: HoverCardProps): ReactElement {
  return <div {...props} data-surface="overlay" className={`hover-card-proto ${className}`} />;
}

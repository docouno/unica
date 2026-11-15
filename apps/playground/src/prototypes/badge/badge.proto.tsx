import { createElement } from 'react';
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import type { DisplayStatus } from './badge.styles.js';
import { statusStyle } from './badge.styles.js';
import './badge.css';

export type BadgeStatus = DisplayStatus;
export interface BadgeProps extends HTMLAttributes<HTMLElement> {
  readonly status?: BadgeStatus;
  readonly size?: 's' | 'm' | 'l';
  readonly dot?: boolean;
  readonly iconLeft?: GlyphComponent;
  /** Native stand-in for the future library's element composition. */
  readonly as?: 'span' | 'a' | 'button';
  readonly href?: string;
  readonly disabled?: boolean;
  readonly ref?: Ref<HTMLElement>;
  /** Pins a state for visual comparison; does not simulate browser focus. */
  readonly previewState?: 'hover' | 'active' | 'focus' | undefined;
}

// Visual prototype; the library API and element composition ship in Wave 2.
export function Badge({
  status = 'neutral',
  size = 'm',
  dot = false,
  iconLeft,
  as = 'span',
  href,
  disabled,
  previewState,
  className = '',
  style,
  children,
  ...props
}: BadgeProps): ReactElement | null {
  if (
    children === null ||
    children === undefined ||
    (typeof children === 'string' && children.trim() === '') ||
    typeof children === 'boolean'
  ) {
    return null;
  }
  const numeric =
    typeof children === 'number' || (typeof children === 'string' && /^\d+[+]?$/u.test(children));
  return createElement(
    as,
    {
      ...props,
      ...(as === 'a' ? { href } : {}),
      ...(as === 'button' ? { type: 'button', disabled } : {}),
      className: `badge-proto ${className}`,
      'data-status': status,
      'data-size': size,
      'data-numeric': numeric && !dot && !iconLeft ? true : undefined,
      'data-preview': previewState,
      style: { ...statusStyle(status), ...style },
    },
    <>
      {iconLeft ? (
        <span className="badge-icon-proto" aria-hidden="true">
          <Icon icon={iconLeft} size={size} />
        </span>
      ) : dot ? (
        <span className="badge-dot-proto" aria-hidden="true" />
      ) : null}
      <span className="badge-label-proto">
        <span className="badge-label-text-proto" dir="auto">
          {children}
        </span>
      </span>
    </>,
  );
}

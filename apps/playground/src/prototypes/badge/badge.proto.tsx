import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import type { DisplayStatus } from './badge.styles.js';
import { statusStyle } from './badge.styles.js';
import './badge.css';

export type BadgeStatus = DisplayStatus;
export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  readonly status?: BadgeStatus;
  readonly size?: 's' | 'm' | 'l';
  readonly dot?: boolean;
  readonly icon?: ReactNode;
}

export function Badge({
  status = 'neutral',
  size = 's',
  dot = false,
  icon,
  className = '',
  style,
  children,
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={`badge-proto ${className}`}
      data-status={status}
      data-size={size}
      style={{ ...statusStyle(status), ...style }}
    >
      {dot && <span className="badge-dot-proto" aria-hidden="true" />}
      {icon && (
        <span className="badge-icon-proto" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="badge-label-proto">{children}</span>
    </span>
  );
}

import type { ComponentPropsWithRef, ReactElement } from 'react';
import type { DisplayStatus } from '../badge/badge.styles.js';
import { statusStyle } from '../badge/badge.styles.js';
import './avatar.css';

export interface AvatarProps extends ComponentPropsWithRef<'span'> {
  readonly initials?: string;
  readonly size?: '2xs' | 'xs' | 's' | 'm' | 'l';
  readonly tone?: DisplayStatus;
  readonly src?: string;
  readonly alt?: string;
}

export function Avatar({
  initials = '',
  size = 'm',
  tone = 'neutral',
  src,
  alt,
  className = '',
  style,
  children,
  ...props
}: AvatarProps): ReactElement {
  return (
    <span
      {...props}
      className={`avatar-proto ${className}`}
      data-size={size}
      style={{ ...statusStyle(tone), ...style }}
    >
      {src ? <img src={src} alt={alt ?? initials} /> : (children ?? initials)}
    </span>
  );
}

export function AvatarGroup({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`avatar-group-proto ${className}`} />;
}

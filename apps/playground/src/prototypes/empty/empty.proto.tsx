import { Children, createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Icon } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import type { HeadingTag } from '../title/title.proto.js';
import './empty.css';

export interface EmptyProps extends ComponentPropsWithRef<'div'> {
  readonly size?: 's' | 'm' | 'l';
  readonly align?: 'start' | 'center';
}

export type EmptyMediaColor = 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export interface EmptyMediaProps extends Omit<ComponentPropsWithRef<'div'>, 'color'> {
  readonly icon?: GlyphSource;
  readonly color?: EmptyMediaColor;
}

export interface EmptyTitleProps extends ComponentPropsWithRef<'h3'> {
  readonly as?: HeadingTag;
}

function hasContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => child !== '');
}

export function Empty({
  size = 'm',
  align = 'center',
  className = '',
  ...props
}: EmptyProps): ReactElement {
  return (
    <div {...props} className={`empty-proto ${className}`} data-size={size} data-align={align} />
  );
}

export function EmptyMedia({
  icon,
  color = 'muted',
  children,
  className = '',
  ...props
}: EmptyMediaProps): ReactElement | null {
  if (hasContent(children)) {
    return (
      <div {...props} className={`empty-media-proto ${className}`} data-kind="illustration">
        {children}
      </div>
    );
  }
  if (!icon) {
    return null;
  }
  return (
    <div
      {...props}
      className={`empty-media-proto ${className}`}
      data-kind="medallion"
      data-color={color}
      aria-hidden="true"
    >
      <Icon usage="slot" icon={icon} />
    </div>
  );
}

export function EmptyTitle({
  as = 'h3',
  children,
  className = '',
  ...props
}: EmptyTitleProps): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  return createElement(as, { ...props, className: `empty-title-proto ${className}` }, children);
}

export function EmptyDescription({
  children,
  className = '',
  ...props
}: ComponentPropsWithRef<'p'>): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  return (
    <p {...props} className={`empty-description-proto ${className}`}>
      {children}
    </p>
  );
}

export function EmptyActions({
  children,
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement | null {
  if (!hasContent(children)) {
    return null;
  }
  return (
    <div {...props} className={`empty-actions-proto ${className}`}>
      {children}
    </div>
  );
}

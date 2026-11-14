import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { Icon } from '../icon/icon.proto.js';
import { Kbd } from '../kbd/kbd.proto.js';
import './menu.css';

export interface MenuProps extends ComponentPropsWithRef<'div'> {
  readonly label?: string;
}
export function Menu({
  label = 'Document actions',
  className = '',
  ...props
}: MenuProps): ReactElement {
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      data-surface="overlay"
      className={`menu-proto ${className}`}
    />
  );
}

export interface MenuItemProps extends ComponentPropsWithRef<'button'> {
  readonly icon?: GlyphComponent;
  readonly shortcut?: ReactNode;
  readonly danger?: boolean;
}
export function MenuItem({
  icon,
  shortcut,
  danger,
  children,
  className = '',
  ...props
}: MenuItemProps): ReactElement {
  return (
    <button
      type="button"
      {...props}
      className={`menu-item-proto ${className}`}
      data-danger={danger || undefined}
    >
      {icon && <Icon icon={icon} size="s" />}
      <span>{children}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  );
}
export function MenuSeparator(): ReactElement {
  return <hr className="menu-separator-proto" />;
}
export interface HoverCardProps extends ComponentPropsWithRef<'div'> {
  readonly children: ReactNode;
}
export function HoverCard({ className = '', ...props }: HoverCardProps): ReactElement {
  return <div {...props} data-surface="overlay" className={`hover-card-proto ${className}`} />;
}

export interface TooltipProps extends ComponentPropsWithRef<'div'> {
  readonly shortcut?: ReactNode;
}
export function Tooltip({
  shortcut,
  children,
  className = '',
  ...props
}: TooltipProps): ReactElement {
  return (
    <div {...props} role="tooltip" data-surface="overlay" className={`tooltip-proto ${className}`}>
      <span>{children}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </div>
  );
}

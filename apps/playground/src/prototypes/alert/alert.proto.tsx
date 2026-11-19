import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, XIcon } from '@phosphor-icons/react';
import { statusStyle } from '../badge/badge.styles.js';
import './alert.css';

export type AlertStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertSize = 's' | 'm' | 'l';

export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  readonly status?: AlertStatus;
  readonly size?: AlertSize;
  readonly icon?: ReactNode;
  readonly onClose?: () => void;
  readonly closeLabel?: string;
  /** Explicit comparison pins for the specimen, not proposed public props. */
  readonly previewClose?: 'rest' | 'hover' | 'active' | 'focus';
}

// Visual reference. Reusable live-region and focus integration belong to Wave 2.
export function Alert({
  status = 'neutral',
  size = 'm',
  icon,
  onClose,
  closeLabel = 'Dismiss message',
  previewClose,
  className = '',
  style,
  children,
  ...props
}: AlertProps): ReactElement {
  const Glyph =
    status === 'success'
      ? CheckCircleIcon
      : status === 'warning'
        ? WarningIcon
        : status === 'danger'
          ? XCircleIcon
          : InfoIcon;
  const leading = icon || (status !== 'neutral' ? <Glyph weight="fill" /> : null);
  return (
    <div
      {...props}
      className={`alert-proto ${className}`}
      data-status={status}
      data-size={size}
      style={{ ...statusStyle(status), ...style }}
    >
      {leading && (
        <span className="alert-icon-proto" aria-hidden="true">
          {leading}
        </span>
      )}
      <div className="alert-content-proto">{children}</div>
      {onClose && (
        <button
          type="button"
          className="alert-close-proto"
          aria-label={closeLabel}
          data-preview={previewClose}
          onClick={onClose}
        >
          <XIcon size="1em" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface AlertTitleProps extends ComponentPropsWithRef<'div'> {
  readonly as?: 'div' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function AlertTitle({
  as: Element = 'div',
  className = '',
  children,
  ...props
}: AlertTitleProps): ReactElement | null {
  if (children === null || children === undefined || children === false || children === '') {
    return null;
  }
  return (
    <Element {...props} className={`alert-title-proto ${className}`}>
      {children}
    </Element>
  );
}

export type AlertDescriptionProps = ComponentPropsWithRef<'div'>;

export function AlertDescription({
  className = '',
  children,
  ...props
}: AlertDescriptionProps): ReactElement | null {
  if (children === null || children === undefined || children === false || children === '') {
    return null;
  }
  return (
    <div {...props} className={`alert-description-proto ${className}`}>
      {children}
    </div>
  );
}

export type AlertActionsProps = ComponentPropsWithRef<'div'>;

export function AlertActions({
  className = '',
  children,
  ...props
}: AlertActionsProps): ReactElement | null {
  if (children === null || children === undefined || children === false || children === '') {
    return null;
  }
  return (
    <div {...props} className={`alert-actions-proto ${className}`}>
      {children}
    </div>
  );
}

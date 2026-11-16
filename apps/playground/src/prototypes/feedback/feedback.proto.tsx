import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, XIcon } from '@phosphor-icons/react';
import { Icon } from '../icon/icon.proto.js';
import type { DisplayStatus } from '../badge/badge.styles.js';
import { statusStyle } from '../badge/badge.styles.js';
import './feedback.css';

export interface FeedbackProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  readonly status?: DisplayStatus;
  readonly title?: ReactNode;
  readonly icon?: ReactNode;
  readonly onDismiss?: () => void;
}

function StatusGlyph({
  status,
  size = 'm',
}: {
  readonly status: DisplayStatus;
  readonly size?: 's' | 'm';
}): ReactElement {
  const glyph =
    status === 'success'
      ? CheckCircleIcon
      : status === 'warning'
        ? WarningIcon
        : status === 'danger'
          ? XCircleIcon
          : InfoIcon;
  return <Icon icon={glyph} size={size} />;
}

export function Alert({
  status = 'info',
  title,
  icon,
  onDismiss,
  className = '',
  style,
  children,
  ...props
}: FeedbackProps): ReactElement {
  return (
    <div
      {...props}
      className={`alert-proto ${className}`}
      data-status={status}
      style={{ ...statusStyle(status), ...style }}
    >
      <span className="feedback-icon-proto" aria-hidden="true">
        {icon ?? <StatusGlyph status={status} size="s" />}
      </span>
      <div className="feedback-copy-proto">
        {title && <div className="feedback-title-proto">{title}</div>}
        {children && <div className="feedback-description-proto">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="feedback-close-proto"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <XIcon size="1em" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function Toast({
  status = 'success',
  title,
  icon,
  onDismiss,
  className = '',
  style,
  children,
  ...props
}: FeedbackProps): ReactElement {
  return (
    <div
      role="status"
      {...props}
      className={`toast-proto ${className}`}
      data-surface="overlay"
      style={{ ...statusStyle(status), ...style }}
    >
      <span className="feedback-icon-proto" aria-hidden="true">
        {icon ?? <StatusGlyph status={status} />}
      </span>
      <div className="feedback-copy-proto">
        {title && <div className="feedback-title-proto">{title}</div>}
        {children && <div className="feedback-description-proto">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="feedback-close-proto"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <XIcon size="1em" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface IndicatorProps extends ComponentPropsWithRef<'span'> {
  readonly status?: DisplayStatus;
  readonly label?: string;
}

export function Indicator({
  status = 'success',
  label,
  className = '',
  style,
  children,
  ...props
}: IndicatorProps): ReactElement {
  return (
    <span
      {...props}
      className={`indicator-proto ${className}`}
      data-with-content={children ? true : undefined}
      style={{ ...statusStyle(status), ...style }}
    >
      {children}
      <span
        className="indicator-dot-proto"
        aria-label={label}
        role={label ? 'img' : undefined}
        aria-hidden={label ? undefined : true}
      />
    </span>
  );
}

export function Skeleton({
  className = '',
  ...props
}: ComponentPropsWithRef<'span'>): ReactElement {
  return <span {...props} className={`skeleton-proto ${className}`} aria-hidden="true" />;
}

export interface SkeletonTextProps extends ComponentPropsWithRef<'div'> {
  readonly lines?: number;
}

export function SkeletonText({
  lines = 3,
  className = '',
  ...props
}: SkeletonTextProps): ReactElement {
  const count = Math.min(8, Math.max(1, Math.floor(Number.isFinite(lines) ? lines : 3)));
  return (
    <div {...props} className={`skeleton-text-proto ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={`line-${index}`} />
      ))}
    </div>
  );
}

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

function StatusGlyph({ status }: { readonly status: DisplayStatus }): ReactElement {
  const glyph =
    status === 'success'
      ? CheckCircleIcon
      : status === 'warning'
        ? WarningIcon
        : status === 'danger'
          ? XCircleIcon
          : InfoIcon;
  return <Icon icon={glyph} size="m" />;
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

export interface SpinnerProps extends ComponentPropsWithRef<'span'> {
  readonly size?: 's' | 'm' | 'l' | 'inherit';
  readonly label?: string;
}

export function Spinner({
  size = 'm',
  label = 'Loading',
  className = '',
  ...props
}: SpinnerProps): ReactElement {
  return (
    <span
      role="img"
      aria-label={label}
      {...props}
      className={`spinner-proto ${className}`}
      data-size={size}
    />
  );
}

export interface ProgressProps extends Omit<ComponentPropsWithRef<'progress'>, 'value' | 'max'> {
  readonly value?: number;
  readonly max?: number;
  readonly label?: string;
  readonly status?: DisplayStatus;
}

export function Progress({
  value,
  max = 100,
  label,
  status = 'accent',
  className = '',
  style,
  hidden,
  ...props
}: ProgressProps): ReactElement {
  const ceiling = Number.isFinite(max) && max > 0 ? max : 100;
  const progress =
    value === undefined
      ? undefined
      : Number.isFinite(value)
        ? Math.min(ceiling, Math.max(0, value))
        : 0;
  return (
    <div
      className={`progress-proto ${className}`}
      hidden={hidden}
      style={{ ...statusStyle(status), ...style }}
    >
      {label && (
        <div className="progress-label-proto">
          <span>{label}</span>
          {progress !== undefined && <span>{Math.round((progress / ceiling) * 100)}%</span>}
        </div>
      )}
      <progress
        {...props}
        className="progress-track-proto"
        value={progress}
        max={ceiling}
        aria-label={props['aria-label'] ?? label ?? 'Progress'}
      />
    </div>
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

import { useId } from 'react';
import type { ComponentPropsWithRef, CSSProperties, ReactElement } from 'react';
import './progress.css';

export type SpinnerTone = 'inherit' | 'neutral' | 'muted' | 'accent';

export interface SpinnerProps extends Omit<ComponentPropsWithRef<'svg'>, 'children'> {
  readonly size?: 'inherit' | 's' | 'm' | 'l';
  readonly tone?: SpinnerTone;
  readonly delay?: number;
  /** Static appearance for motion comparison; not a component state. */
  readonly previewStatic?: boolean;
}

// Both activity primitives share one silhouette, including the Pixel perimeter.
export function ActivityGlyph({ fraction }: { readonly fraction?: number }): ReactElement {
  const measured = fraction !== undefined;
  return (
    <>
      <g className="activity-spinner-round">
        <circle className="activity-spinner-track" cx="12" cy="12" r="9.5" />
        <g className={measured ? undefined : 'activity-spinner-orbit'}>
          <circle
            className={measured ? 'activity-circle-fill' : 'activity-spinner-arc'}
            cx="12"
            cy="12"
            r="9.5"
            pathLength="100"
            strokeDasharray={measured ? `${fraction * 100} 100` : '28 72'}
          />
        </g>
      </g>
      <g className="activity-spinner-pixels" fill="currentColor" stroke="none">
        {(
          [
            [9.75, 2.5],
            [17, 2.5],
            [17, 9.75],
            [17, 17],
            [9.75, 17],
            [2.5, 17],
            [2.5, 9.75],
            [2.5, 2.5],
          ] as const
        ).map(([x, y], index) => {
          const amount = measured ? Math.min(1, Math.max(0, fraction * 8 - index)) : 0;
          const vertical = index === 1 || index === 2 || index === 5 || index === 6;
          const reverse = index >= 3 && index <= 6;
          return measured ? (
            <g key={index}>
              <rect className="activity-circle-cell-track" x={x} y={y} width="4.5" height="4.5" />
              <rect
                className="activity-circle-cell-fill"
                x={x + (!vertical && reverse ? 4.5 * (1 - amount) : 0)}
                y={y + (vertical && reverse ? 4.5 * (1 - amount) : 0)}
                width={vertical ? 4.5 : 4.5 * amount}
                height={vertical ? 4.5 * amount : 4.5}
              />
            </g>
          ) : (
            <rect
              className="activity-spinner-cell"
              key={index}
              x={x}
              y={y}
              width="4.5"
              height="4.5"
              style={
                {
                  '--cell': index,
                  '--cell-rest': index === 0 ? 1 : index === 7 ? 0.55 : index === 6 ? 0.3 : 0.14,
                } as CSSProperties
              }
            />
          );
        })}
      </g>
    </>
  );
}

// Visual prototype. The owner supplies the operation's text and announcements.
export function Spinner({
  size = 'inherit',
  tone = 'inherit',
  delay = 0,
  previewStatic,
  'aria-label': label,
  className = '',
  style,
  ...props
}: SpinnerProps): ReactElement {
  const name = label?.trim() || undefined;
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      className={`activity-spinner ${className}`}
      data-size={size}
      data-tone={tone}
      data-static={previewStatic || undefined}
      role={name ? 'img' : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      focusable="false"
      style={
        {
          ...style,
          '--spinner-delay': `${Number.isFinite(delay) ? Math.max(0, delay) : 0}ms`,
        } as CSSProperties
      }
    >
      <ActivityGlyph />
    </svg>
  );
}

export type ProgressStatus = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  readonly value: number | null;
  readonly max?: number;
  readonly label?: string;
  readonly valueLabel?: string;
  readonly showValue?: boolean;
  readonly size?: 's' | 'm' | 'l';
  readonly status?: ProgressStatus;
  readonly paused?: boolean;
  /** The owner reports active work; a measured fraction alone is not activity. */
  readonly active?: boolean;
  /** Pins the waiting texture; not a paused operation. */
  readonly previewStatic?: boolean;
}

// A passive phase indicator: completion and announcements belong to its owner.
export function Progress({
  value,
  max = 100,
  label,
  valueLabel,
  showValue = true,
  size = 'm',
  status = 'accent',
  paused = false,
  active = false,
  previewStatic,
  className = '',
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  ...props
}: ProgressProps): ReactElement {
  const id = useId();
  const known = value !== null && Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const fraction = known ? Math.min(1, Math.max(0, value / max)) : 0;
  const percent = fraction === 1 ? 100 : Math.min(99, Math.floor(fraction * 100 + 1e-9));
  const visibleValue = showValue ? (valueLabel ?? (known ? `${percent}%` : '100%')) : undefined;
  const prefix = status === 'accent' || status === 'neutral' ? status : `status-${status}`;
  return (
    <div
      {...props}
      className={`activity-progress ${className}`}
      data-size={size}
      data-status={status}
      data-indeterminate={!known || undefined}
      data-empty={(known && fraction === 0) || undefined}
      data-full={(known && fraction === 1) || undefined}
      data-paused={paused || undefined}
      data-active={
        (active &&
          !paused &&
          known &&
          fraction > 0 &&
          fraction < 1 &&
          (status === 'accent' || status === 'neutral' || status === 'info')) ||
        undefined
      }
      data-resting={
        paused || status === 'warning' || status === 'danger' || status === 'success' || undefined
      }
      data-static={previewStatic || undefined}
      style={
        {
          ...style,
          '--progress-fraction': `${fraction * 100}%`,
          '--progress-tip-strength': Math.min(1, fraction * 20),
          '--progress-color': status === 'neutral' ? 'var(--fg-muted)' : `var(--${prefix}-signal)`,
        } as CSSProperties
      }
    >
      {(label || visibleValue) && (
        <div className="activity-progress-heading">
          {label && (
            <span className="activity-progress-label" id={`${id}-label`}>
              {label}
            </span>
          )}
          {visibleValue && (
            <span
              className="activity-progress-value"
              data-unknown={!known || undefined}
              data-custom={Boolean(valueLabel) || undefined}
              aria-hidden={!known || undefined}
            >
              <bdi>{visibleValue}</bdi>
            </span>
          )}
        </div>
      )}
      <div
        className="activity-progress-track"
        role="progressbar"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy ?? (!ariaLabel && label ? `${id}-label` : undefined)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? percent : undefined}
        aria-valuetext={known ? valueLabel : undefined}
      >
        {known ? (
          <span className="activity-progress-fill">
            <span className="activity-progress-tip" />
          </span>
        ) : (
          <span className="activity-progress-wait" />
        )}
      </div>
    </div>
  );
}

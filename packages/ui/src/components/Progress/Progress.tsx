import { useId } from 'react';
import type { CSSProperties, JSX } from 'react';
import { measure, percentLabel } from './measurement.js';
import { nonBlank, passiveAttributes } from './passive.js';
import type { PassiveProps } from './passive.js';
import './progress.css';

export type ProgressSize = 's' | 'm' | 'l';
export type ProgressStatus = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ProgressProps extends PassiveProps<'div'> {
  readonly value: number | null;
  readonly max?: number | undefined;
  readonly label?: string | undefined;
  readonly valueLabel?: string | undefined;
  readonly showValue?: boolean | undefined;
  readonly size?: ProgressSize | undefined;
  readonly status?: ProgressStatus | undefined;
  readonly active?: boolean | undefined;
  readonly paused?: boolean | undefined;
}

const statusColor: Readonly<Record<ProgressStatus, string>> = {
  accent: 'var(--accent-signal)',
  neutral: 'var(--fg-muted)',
  info: 'var(--status-info-signal)',
  success: 'var(--status-success-signal)',
  warning: 'var(--status-warning-signal)',
  danger: 'var(--status-danger-signal)',
};

export function Progress({
  value,
  max = 100,
  label,
  valueLabel,
  showValue = true,
  size = 'm',
  status = 'accent',
  active = false,
  paused = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': describedBy,
  'aria-description': description,
  'aria-valuetext': ariaValueText,
  className,
  style,
  ...props
}: ProgressProps): JSX.Element {
  const labelId = useId();
  const measurement = measure(value, max);
  const fraction = measurement?.fraction ?? 0;
  const heading = nonBlank(label);
  const accessibleLabel = nonBlank(ariaLabel);
  const labelledBy =
    nonBlank(ariaLabelledBy) ?? (accessibleLabel ? undefined : heading ? labelId : undefined);
  const units = nonBlank(valueLabel);
  const visibleValue = showValue
    ? (units ?? (measurement ? percentLabel(measurement) : '100%'))
    : undefined;
  const full = measurement !== undefined && measurement.value === measurement.max;
  const resting = paused || status === 'warning' || status === 'danger' || status === 'success';

  return (
    <div
      {...passiveAttributes(props)}
      className={className ? `unica-progress ${className}` : 'unica-progress'}
      data-size={size}
      data-status={status}
      data-indeterminate={!measurement || undefined}
      data-empty={(measurement !== undefined && fraction === 0) || undefined}
      data-full={full || undefined}
      data-paused={paused || undefined}
      data-active={(active && !resting && fraction > 0 && !full) || undefined}
      data-resting={resting || undefined}
      style={
        {
          ...style,
          '--_progress-fraction': `${fraction * 100}%`,
          '--_progress-tip-strength': Math.min(1, fraction * 20),
          '--_progress-color': statusColor[status],
        } as CSSProperties
      }
    >
      {(heading || visibleValue) && (
        <div className="unica-progress-heading">
          {heading && (
            <span className="unica-progress-label" id={labelId}>
              {heading}
            </span>
          )}
          {visibleValue && (
            <span
              className="unica-progress-value"
              data-custom={Boolean(units) || undefined}
              aria-hidden={!measurement || undefined}
            >
              <bdi>{visibleValue}</bdi>
            </span>
          )}
        </div>
      )}
      <div
        className="unica-progress-track"
        role="progressbar"
        aria-label={accessibleLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-description={description}
        aria-valuemin={measurement ? 0 : undefined}
        aria-valuemax={measurement?.max}
        aria-valuenow={measurement?.value}
        aria-valuetext={measurement ? (nonBlank(ariaValueText) ?? units) : undefined}
      >
        {measurement ? (
          <span className="unica-progress-fill">
            <span className="unica-progress-tip" />
          </span>
        ) : (
          <span className="unica-progress-wait" />
        )}
      </div>
    </div>
  );
}

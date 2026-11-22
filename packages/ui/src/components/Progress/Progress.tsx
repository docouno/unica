import { useId } from 'react';
import type { CSSProperties, JSX } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { nonBlank, passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import { measure, percentLabel } from './measurement.js';
import type { ProgressProps, ProgressStatus } from './types.js';
import './progress.css';

export type { ProgressProps, ProgressSize, ProgressStatus } from './types.js';

const statusColor: Readonly<Record<ProgressStatus, string>> = {
  accent: 'var(--accent-signal)',
  neutral: 'var(--fg-muted)',
  info: 'var(--status-info-signal)',
  success: 'var(--status-success-signal)',
  warning: 'var(--status-warning-signal)',
  danger: 'var(--status-danger-signal)',
};

/**
 * Linear progress bar (`role="progressbar"`) supporting determinate (`0..max`) and indeterminate
 * (`null`) work. Requires a non-blank `label`, `aria-label`, or `aria-labelledby` unless
 * `aria-hidden` is true.
 */
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
  'aria-hidden': ariaHidden,
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
  const hidden = ariaHidden === true || ariaHidden === 'true';
  if (!hidden && !accessibleLabel && !labelledBy) {
    warnOnce(
      'progress-missing-name',
      'Progress requires a non-blank label, aria-label, or aria-labelledby unless aria-hidden is true.',
    );
  }
  const units = nonBlank(valueLabel);
  const visibleValue = showValue
    ? (units ?? (measurement ? percentLabel(measurement) : '100%'))
    : undefined;
  const full = measurement !== undefined && measurement.value === measurement.max;
  const resting = paused || status === 'warning' || status === 'danger' || status === 'success';

  return (
    <div
      {...passiveIndicatorAttributes(props)}
      aria-hidden={ariaHidden}
      className={cx('unica-progress', className)}
      data-unica-progress-size={size}
      data-unica-progress-status={status}
      data-unica-progress-indeterminate={dataFlag(!measurement)}
      data-unica-progress-empty={dataFlag(measurement !== undefined && fraction === 0)}
      data-unica-progress-full={dataFlag(full)}
      data-unica-progress-paused={dataFlag(paused)}
      data-unica-progress-active={dataFlag(active && !resting && fraction > 0 && !full)}
      data-unica-progress-resting={dataFlag(resting)}
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
              data-unica-progress-custom={dataFlag(Boolean(units))}
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

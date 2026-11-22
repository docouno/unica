import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import type { IndicatorProps } from './types.js';
import './indicator.css';

export type { IndicatorPosition, IndicatorProps, IndicatorStatus } from './types.js';

function formatCount(
  count: number | null | undefined,
  max: number,
  showZero: boolean,
): string | null {
  if (typeof count === 'number' && (!Number.isSafeInteger(count) || count < 0)) {
    warnOnce(
      'indicator-invalid-count',
      `Indicator count must be a non-negative safe integer; received ${String(count)}.`,
    );
  }
  if (!Number.isSafeInteger(max) || max <= 0) {
    warnOnce(
      'indicator-invalid-max',
      `Indicator max must be a positive safe integer; received ${String(max)}.`,
    );
  }
  if (
    typeof count !== 'number' ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Number.isSafeInteger(max) ||
    max <= 0 ||
    (count === 0 && !showZero)
  ) {
    return null;
  }
  return count > max ? `${max}+` : String(count);
}

/**
 * Anchors a decorative count or status dot to a single host element. The host element
 * retains ownership of accessible naming for the count or status.
 */
export function Indicator({
  children,
  dot = false,
  count,
  max = 99,
  showZero = false,
  position = 'top-end',
  status = 'accent',
  size = 'm',
  overlap = 'rectangular',
  width = 'auto',
  withBorder = true,
  visible = true,
  className,
  ...props
}: IndicatorProps): ReactElement {
  const label = dot ? null : formatCount(count, max, showZero);

  return (
    <span
      {...props}
      className={cx('unica-indicator', className)}
      data-unica-indicator-position={position}
      data-unica-indicator-status={status}
      data-unica-indicator-size={size}
      data-unica-indicator-overlap={overlap}
      data-unica-indicator-width={width}
    >
      {children}
      {visible && (dot || label !== null) && (
        <span className="unica-indicator-anchor">
          <span
            className="unica-indicator-marker"
            data-unica-indicator-mode={dot ? 'dot' : 'count'}
            data-unica-indicator-border={dataFlag(withBorder)}
            aria-hidden="true"
          >
            {label !== null && <bdi dir="ltr">{label}</bdi>}
          </span>
        </span>
      )}
    </span>
  );
}

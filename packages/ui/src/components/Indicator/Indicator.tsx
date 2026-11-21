import type { ComponentPropsWithRef, ReactElement } from 'react';
import './indicator.css';

export type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export type IndicatorStatus = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

interface IndicatorHostProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'children' | 'dangerouslySetInnerHTML'
> {
  readonly children: ReactElement;
  readonly position?: IndicatorPosition;
  readonly status?: IndicatorStatus;
  readonly size?: 's' | 'm' | 'l';
  readonly overlap?: 'rectangular' | 'circular';
  readonly width?: 'auto' | 'full';
  readonly withBorder?: boolean;
  readonly visible?: boolean;
}

export type IndicatorProps = IndicatorHostProps &
  (
    | {
        readonly dot?: false;
        readonly count?: number | null | undefined;
        readonly max?: number;
        readonly showZero?: boolean;
      }
    | {
        readonly dot: true;
        readonly count?: never;
        readonly max?: never;
        readonly showZero?: never;
      }
  );

function formatCount(
  count: number | null | undefined,
  max: number,
  showZero: boolean,
): string | null {
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
      className={className ? `unica-indicator ${className}` : 'unica-indicator'}
      data-position={position}
      data-status={status}
      data-size={size}
      data-overlap={overlap}
      data-width={width}
    >
      {children}
      {visible && (dot || label !== null) && (
        <span className="unica-indicator-anchor">
          <span
            className="unica-indicator-marker"
            data-mode={dot ? 'dot' : 'count'}
            data-border={withBorder ? '' : undefined}
            aria-hidden="true"
          >
            {label !== null && <bdi dir="ltr">{label}</bdi>}
          </span>
        </span>
      )}
    </span>
  );
}

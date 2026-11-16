import type { ComponentPropsWithRef, CSSProperties, ReactElement } from 'react';
import './indicator.css';

export type IndicatorStatus = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type IndicatorSize = 's' | 'm' | 'l';
export type IndicatorPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface IndicatorProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  readonly children: ReactElement;
  readonly dot?: boolean;
  readonly count?: number | null;
  readonly max?: number;
  readonly showZero?: boolean;
  readonly visible?: boolean;
  readonly status?: IndicatorStatus;
  readonly size?: IndicatorSize;
  readonly placement?: IndicatorPlacement;
  readonly overlap?: 'rectangular' | 'circular';
  readonly withBorder?: boolean;
  readonly width?: 'auto' | 'full';
}

// Visual prototype: the marker is decorative; its host owns its meaning and action.
export function Indicator({
  children,
  dot = false,
  count,
  max = 99,
  showZero = false,
  visible = true,
  status = 'accent',
  size = 'm',
  placement = 'top-end',
  overlap = 'rectangular',
  withBorder = true,
  width = 'auto',
  className = '',
  style,
  ...props
}: IndicatorProps): ReactElement {
  const validCount = typeof count === 'number' && Number.isSafeInteger(count) && count >= 0;
  const validMax = Number.isSafeInteger(max) && max > 0;
  const shown = visible && (dot || (validCount && validMax && (count > 0 || showZero)));
  const prefix = status === 'neutral' || status === 'accent' ? status : `status-${status}`;
  const markerStyle = {
    '--indicator-fill': `var(--${prefix}-${dot ? 'signal' : 'solid'})`,
    '--indicator-ink': `var(--fg-on-${status})`,
    ...style,
  } as CSSProperties;

  return (
    <span
      {...props}
      className={`indicator-proto ${className}`}
      data-size={size}
      data-placement={placement}
      data-overlap={overlap}
      data-width={width}
      style={markerStyle}
    >
      {children}
      {shown && (
        <span
          className="indicator-proto-marker"
          data-mode={dot ? 'dot' : 'count'}
          data-border={withBorder || undefined}
          aria-hidden="true"
        >
          {!dot && <bdi dir="ltr">{count! > max ? `${max}+` : count}</bdi>}
        </span>
      )}
    </span>
  );
}

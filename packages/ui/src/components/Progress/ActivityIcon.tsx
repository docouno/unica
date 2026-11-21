import type { CSSProperties, JSX } from 'react';
import type { Measurement } from './measurement.js';
import type { PassiveProps } from './passive.js';
import './activity-icon.css';

export type SpinnerSize = 'inherit' | 's' | 'm' | 'l';
export type SpinnerTone = 'inherit' | 'neutral' | 'muted' | 'accent';

export type ActivityIconProps = Omit<PassiveProps<'svg'>, 'viewBox' | 'max'> & {
  readonly dir?: 'ltr' | 'rtl' | 'auto' | undefined;
  readonly hidden?: boolean | undefined;
  readonly lang?: string | undefined;
  readonly size?: SpinnerSize | undefined;
  readonly tone?: SpinnerTone | undefined;
  readonly viewBox?: never;
};

interface ActivityDrawingProps {
  readonly fraction?: number | undefined;
}

const cellSize = 4.5;
const cells = [
  [9.75, 2.5, 'right'],
  [17, 2.5, 'down'],
  [17, 9.75, 'down'],
  [17, 17, 'left'],
  [9.75, 17, 'left'],
  [2.5, 17, 'up'],
  [2.5, 9.75, 'up'],
  [2.5, 2.5, 'right'],
] as const;

function ActivityCells({ fraction }: ActivityDrawingProps): JSX.Element {
  return (
    <g className="unica-activity-icon-pixels" fill="currentColor" stroke="none">
      {cells.map(([x, y, direction], index) => {
        if (fraction === undefined) {
          const restOpacity = index === 0 ? 1 : index === 7 ? 0.55 : index === 6 ? 0.3 : 0.14;
          return (
            <rect
              key={index}
              className="unica-activity-icon-wait-cell"
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              style={
                { '--_activity-cell': index, '--_activity-cell-rest': restOpacity } as CSSProperties
              }
            />
          );
        }

        const filled = cellSize * Math.max(0, Math.min(1, fraction * cells.length - index));
        const vertical = direction === 'up' || direction === 'down';
        return (
          <g key={index}>
            <rect
              className="unica-activity-icon-cell-track"
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
            />
            <rect
              className="unica-activity-icon-cell-fill"
              x={direction === 'left' ? x + cellSize - filled : x}
              y={direction === 'up' ? y + cellSize - filled : y}
              width={vertical ? cellSize : filled}
              height={vertical ? filled : cellSize}
            />
          </g>
        );
      })}
    </g>
  );
}

interface ActivityFrameProps {
  readonly attributes: ActivityIconProps;
  readonly role: 'img' | 'progressbar' | undefined;
  readonly delay?: number;
  readonly measurement?: Measurement | undefined;
}

export function ActivityIcon({
  attributes,
  role,
  delay,
  measurement,
}: ActivityFrameProps): JSX.Element {
  const { size = 'inherit', tone = 'inherit', className, style, ...props } = attributes;
  const fraction = measurement?.fraction;

  return (
    <svg
      {...props}
      className={className ? `unica-activity-icon ${className}` : 'unica-activity-icon'}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      role={role}
      data-size={size}
      data-tone={tone}
      data-spinner={delay !== undefined || undefined}
      data-empty={fraction === 0 || undefined}
      aria-valuemin={measurement ? 0 : undefined}
      aria-valuemax={measurement?.max}
      aria-valuenow={measurement?.value}
      style={
        delay === undefined
          ? style
          : ({ ...style, '--_activity-delay': `${delay}ms` } as CSSProperties)
      }
    >
      <g className="unica-activity-icon-drawing">
        <g className="unica-activity-icon-round">
          <circle className="unica-activity-icon-track" cx="12" cy="12" r="9.5" />
          {fraction === undefined ? (
            <g className="unica-activity-icon-orbit">
              <circle
                className="unica-activity-icon-wait-arc"
                cx="12"
                cy="12"
                r="9.5"
                pathLength="100"
                strokeDasharray="28 72"
              />
            </g>
          ) : (
            <circle
              className="unica-activity-icon-fill"
              cx="12"
              cy="12"
              r="9.5"
              pathLength="100"
              strokeDasharray={`${fraction * 100} 100`}
            />
          )}
        </g>
        <ActivityCells fraction={fraction} />
      </g>
    </svg>
  );
}

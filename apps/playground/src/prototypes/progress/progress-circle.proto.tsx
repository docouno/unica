import type { ComponentPropsWithRef, ReactElement } from 'react';
import { ActivityGlyph } from './progress.proto.js';
import type { SpinnerTone } from './progress.proto.js';
import './progress-circle.css';

export interface ProgressCircleProps extends Omit<ComponentPropsWithRef<'svg'>, 'children'> {
  readonly value: number | null;
  readonly max?: number;
  readonly size?: 'inherit' | 's' | 'm' | 'l';
  readonly tone?: SpinnerTone;
}

// The Spinner silhouette with a measured amount. Text belongs to the surrounding UI.
export function ProgressCircle({
  value,
  max = 100,
  size = 'inherit',
  tone = 'inherit',
  className = '',
  ...props
}: ProgressCircleProps): ReactElement {
  const known = value !== null && Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const fraction = known ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      className={`activity-spinner activity-circle ${className}`}
      data-size={size}
      data-tone={tone}
      data-unknown={!known || undefined}
      data-empty={(known && fraction === 0) || undefined}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={known ? max : undefined}
      aria-valuenow={known ? Math.min(max, Math.max(0, value)) : undefined}
      focusable="false"
    >
      {known ? (
        <ActivityGlyph key="measured" fraction={fraction} />
      ) : (
        <ActivityGlyph key="unknown" />
      )}
    </svg>
  );
}

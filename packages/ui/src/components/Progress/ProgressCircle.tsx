import type { JSX } from 'react';
import { ActivityIcon } from './ActivityIcon.js';
import type { ActivityIconProps } from './ActivityIcon.js';
import { measure } from './measurement.js';
import { nonBlank, passiveAttributes } from './passive.js';

export interface ProgressCircleProps extends ActivityIconProps {
  readonly value: number | null;
  readonly max?: number | undefined;
}

export function ProgressCircle({
  value,
  max = 100,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-valuetext': valueText,
  ...props
}: ProgressCircleProps): JSX.Element {
  const measurement = measure(value, max);

  return (
    <ActivityIcon
      attributes={{
        ...passiveAttributes(props),
        'aria-label': nonBlank(label),
        'aria-labelledby': nonBlank(labelledBy),
        'aria-valuetext': measurement ? nonBlank(valueText) : undefined,
      }}
      role="progressbar"
      measurement={measurement}
    />
  );
}

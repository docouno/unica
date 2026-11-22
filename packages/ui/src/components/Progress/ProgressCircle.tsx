import type { JSX } from 'react';
import { warnOnce } from '../../core/devWarning.js';
import { nonBlank, passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import { ActivityIcon } from './ActivityIcon.js';
import { measure } from './measurement.js';
import type { ProgressCircleProps } from './types.js';

export type { ProgressCircleProps } from './types.js';

/**
 * Compact circular progress indicator (`role="progressbar"`). Requires a non-blank `aria-label`
 * or `aria-labelledby` unless `aria-hidden` is true.
 */
export function ProgressCircle({
  value,
  max = 100,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-hidden': ariaHidden,
  'aria-valuetext': valueText,
  ...props
}: ProgressCircleProps): JSX.Element {
  const measurement = measure(value, max);
  const resolvedLabel = nonBlank(label);
  const resolvedLabelledBy = nonBlank(labelledBy);
  const hidden = ariaHidden === true || ariaHidden === 'true';
  if (!hidden && !resolvedLabel && !resolvedLabelledBy) {
    warnOnce(
      'progress-circle-missing-name',
      'ProgressCircle requires a non-blank aria-label or aria-labelledby unless aria-hidden is true.',
    );
  }

  return (
    <ActivityIcon
      attributes={{
        ...passiveIndicatorAttributes(props),
        'aria-hidden': ariaHidden,
        'aria-label': resolvedLabel,
        'aria-labelledby': resolvedLabelledBy,
        'aria-valuetext': measurement ? nonBlank(valueText) : undefined,
      }}
      role="progressbar"
      measurement={measurement}
    />
  );
}

import type { JSX } from 'react';
import { nonBlank, passiveIndicatorAttributes } from '../../core/passiveRoot.js';
import { ActivityIcon } from './ActivityIcon.js';
import type { SpinnerProps } from './types.js';

export type { SpinnerProps, SpinnerSize, SpinnerTone } from './types.js';

/**
 * Indeterminate activity spinner. Decorative (`aria-hidden="true"`) unless named via
 * `aria-label` or `aria-labelledby`, with optional CSS reveal `delay`.
 */
export function Spinner({
  delay = 0,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-hidden': ariaHidden,
  ...props
}: SpinnerProps): JSX.Element {
  const label = nonBlank(ariaLabel);
  const labelledBy = nonBlank(ariaLabelledBy);
  const named = Boolean(label || labelledBy);
  const hidden = !named || ariaHidden === true || ariaHidden === 'true';

  return (
    <ActivityIcon
      attributes={{
        ...passiveIndicatorAttributes(props),
        'aria-hidden': hidden || undefined,
        'aria-label': label,
        'aria-labelledby': labelledBy,
        'aria-valuetext': undefined,
      }}
      delay={Number.isFinite(delay) ? Math.max(0, delay) : 0}
      role={hidden ? undefined : 'img'}
    />
  );
}

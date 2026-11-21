import type { JSX } from 'react';
import { ActivityIcon } from './ActivityIcon.js';
import type { ActivityIconProps } from './ActivityIcon.js';
import { nonBlank, passiveAttributes } from './passive.js';

export type { SpinnerSize, SpinnerTone } from './ActivityIcon.js';

export interface SpinnerProps extends ActivityIconProps {
  readonly delay?: number | undefined;
  readonly 'aria-valuetext'?: never;
}

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
        ...passiveAttributes(props),
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

import type { MARK_STATUS, SIZE } from '../../consts.js';
import type { PassiveIndicatorProps } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { PROGRESS_SIZE, PROGRESS_STATUS, SPINNER_SIZE, SPINNER_TONE } from './consts.js';

export type ProgressSize = ExactAxisSubset<
  typeof SIZE,
  typeof PROGRESS_SIZE
>[keyof typeof PROGRESS_SIZE];

export type ProgressStatus = ExactAxisSubset<
  typeof MARK_STATUS,
  typeof PROGRESS_STATUS
>[keyof typeof PROGRESS_STATUS];

export type SpinnerSize = ExactAxisSubset<
  typeof SIZE,
  typeof SPINNER_SIZE
>[keyof typeof SPINNER_SIZE];

export type SpinnerTone = (typeof SPINNER_TONE)[keyof typeof SPINNER_TONE];

type ProgressAccessibleName =
  | {
      readonly label: string;
      readonly 'aria-label'?: string | undefined;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-hidden'?: boolean | 'true' | 'false' | undefined;
    }
  | {
      readonly label?: string | undefined;
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-hidden'?: boolean | 'true' | 'false' | undefined;
    }
  | {
      readonly label?: string | undefined;
      readonly 'aria-label'?: string | undefined;
      readonly 'aria-labelledby': string;
      readonly 'aria-hidden'?: boolean | 'true' | 'false' | undefined;
    }
  | {
      readonly label?: string | undefined;
      readonly 'aria-label'?: string | undefined;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-hidden': true | 'true';
    };

export type ProgressProps = Omit<
  PassiveIndicatorProps<'div'>,
  'aria-label' | 'aria-labelledby' | 'aria-hidden'
> & {
  readonly value: number | null;
  readonly max?: number | undefined;
  readonly valueLabel?: string | undefined;
  readonly showValue?: boolean | undefined;
  readonly size?: ProgressSize | undefined;
  readonly status?: ProgressStatus | undefined;
  readonly active?: boolean | undefined;
  readonly paused?: boolean | undefined;
} & ProgressAccessibleName;

export type ActivityIconProps = Omit<PassiveIndicatorProps<'svg'>, 'viewBox' | 'max'> & {
  readonly dir?: 'ltr' | 'rtl' | 'auto' | undefined;
  readonly hidden?: boolean | undefined;
  readonly lang?: string | undefined;
  readonly size?: SpinnerSize | undefined;
  readonly tone?: SpinnerTone | undefined;
  readonly viewBox?: never;
};

type ProgressCircleAccessibleName =
  | {
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-hidden'?: boolean | 'true' | 'false' | undefined;
    }
  | {
      readonly 'aria-label'?: string | undefined;
      readonly 'aria-labelledby': string;
      readonly 'aria-hidden'?: boolean | 'true' | 'false' | undefined;
    }
  | {
      readonly 'aria-label'?: string | undefined;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-hidden': true | 'true';
    };

export type ProgressCircleProps = Omit<
  ActivityIconProps,
  'aria-label' | 'aria-labelledby' | 'aria-hidden'
> & {
  readonly value: number | null;
  readonly max?: number | undefined;
} & ProgressCircleAccessibleName;

export interface SpinnerProps extends ActivityIconProps {
  readonly delay?: number | undefined;
  readonly 'aria-valuetext'?: never;
}

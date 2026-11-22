import type { ComponentPropsWithRef, ReactElement } from 'react';
import type { MARK_STATUS, SIZE } from '../../consts.js';
import type { ExactAxisSubset } from '../../types.js';
import type {
  INDICATOR_OVERLAP,
  INDICATOR_POSITION,
  INDICATOR_SIZE,
  INDICATOR_STATUS,
  INDICATOR_WIDTH,
} from './consts.js';

export type IndicatorPosition = (typeof INDICATOR_POSITION)[keyof typeof INDICATOR_POSITION];

export type IndicatorStatus = ExactAxisSubset<
  typeof MARK_STATUS,
  typeof INDICATOR_STATUS
>[keyof typeof INDICATOR_STATUS];

export type IndicatorSize = ExactAxisSubset<
  typeof SIZE,
  typeof INDICATOR_SIZE
>[keyof typeof INDICATOR_SIZE];

export type IndicatorOverlap = (typeof INDICATOR_OVERLAP)[keyof typeof INDICATOR_OVERLAP];

export type IndicatorWidth = (typeof INDICATOR_WIDTH)[keyof typeof INDICATOR_WIDTH];

interface IndicatorHostProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'children' | 'dangerouslySetInnerHTML'
> {
  readonly children: ReactElement;
  readonly position?: IndicatorPosition | undefined;
  readonly status?: IndicatorStatus | undefined;
  readonly size?: IndicatorSize | undefined;
  readonly overlap?: IndicatorOverlap | undefined;
  readonly width?: IndicatorWidth | undefined;
  readonly withBorder?: boolean | undefined;
  readonly visible?: boolean | undefined;
}

export type IndicatorProps = IndicatorHostProps &
  (
    | {
        readonly dot?: false | undefined;
        readonly count?: number | null | undefined;
        readonly max?: number | undefined;
        readonly showZero?: boolean | undefined;
      }
    | {
        readonly dot: true;
        readonly count?: never;
        readonly max?: never;
        readonly showZero?: never;
      }
  );

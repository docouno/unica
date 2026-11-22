import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import type { TYPOGRAPHY_STEP } from '../../consts.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { SKELETON_SHAPE, SKELETON_TEXT_SIZE } from './consts.js';

export type SkeletonShape = (typeof SKELETON_SHAPE)[keyof typeof SKELETON_SHAPE];

export type SkeletonTextSize = ExactAxisSubset<
  typeof TYPOGRAPHY_STEP,
  typeof SKELETON_TEXT_SIZE
>[keyof typeof SKELETON_TEXT_SIZE];

interface PlaceholderProps {
  readonly children?: never;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly id?: string | undefined;
  readonly dir?: HTMLAttributes<HTMLElement>['dir'] | undefined;
  readonly hidden?: boolean | undefined;
  readonly width?: CSSProperties['inlineSize'] | undefined;
  readonly [data: `data-${string}`]: DataAttributeValue;
}

export interface SkeletonProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLSpanElement> | undefined;
  readonly shape?: SkeletonShape | undefined;
  readonly height?: CSSProperties['blockSize'] | undefined;
}

export interface SkeletonTextProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLDivElement> | undefined;
  readonly size?: SkeletonTextSize | undefined;
  readonly lines?: number | undefined;
}

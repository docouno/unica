import { createRef } from 'react';
import { Skeleton, SkeletonText } from '../src/index.js';
import type { SkeletonProps, SkeletonTextProps } from '../src/server.js';

export const shape = {
  shape: 'circle',
  width: 'var(--media-size)',
  height: 40,
  ref: createRef<HTMLSpanElement>(),
  'data-query': 'figure',
} satisfies SkeletonProps;

export const text = {
  size: 'heading-xl',
  lines: 1,
  width: '100%',
  ref: createRef<HTMLDivElement>(),
} satisfies SkeletonTextProps;

export const valid = (
  <>
    <Skeleton {...shape} />
    <SkeletonText {...text} />
  </>
);

// @ts-expect-error The geometric placeholder is childless.
export const shapeChildren = <Skeleton>Content</Skeleton>;
// @ts-expect-error The text placeholder owns its visual lines.
export const textChildren = <SkeletonText>Content</SkeletonText>;
// @ts-expect-error A decorative placeholder cannot receive events.
export const click = <SkeletonText onClick={() => undefined} />;
// @ts-expect-error A decorative placeholder cannot receive a role.
export const role = <Skeleton role="button" />;
// @ts-expect-error A decorative placeholder has no tab stop.
export const focus = <SkeletonText tabIndex={0} />;
// @ts-expect-error Only the specified typography steps are supported.
export const size = <SkeletonText size="body-xs" />;
// @ts-expect-error Height comes from the typography step.
export const height = <SkeletonText height={12} />;
// @ts-expect-error Height describes the geometric shape, which has no line count.
export const lines = <Skeleton lines={3} />;
// @ts-expect-error A text root ref must refer to a div.
export const ref = <SkeletonText ref={createRef<HTMLButtonElement>()} />;

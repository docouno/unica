import type { CSSProperties, ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { SKELETON_TEXT_SIZE } from './consts.js';
import { useSkeletonSweep } from './sweep.js';
import type { SkeletonProps, SkeletonTextProps, SkeletonTextSize } from './types.js';
import './skeleton.css';

export type { SkeletonProps, SkeletonTextProps } from './types.js';

function dimension(value: CSSProperties['inlineSize']): CSSProperties['inlineSize'] {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * Decorative loading placeholder block (`rect` or `circle`) synchronized with the document
 * diagonal shimmer sweep. Hidden from assistive technology and keyboard focus.
 */
export function Skeleton({
  ref,
  shape,
  width,
  height,
  hidden,
  className,
  style,
  id,
  dir,
  ...props
}: SkeletonProps): ReactElement {
  const rootRef = useSkeletonSweep(ref);
  return (
    <span
      {...pickConsumerDataAttributes(props, 'data-unica-skeleton-')}
      ref={rootRef}
      id={id}
      dir={dir}
      hidden={hidden}
      className={cx('unica-skeleton', className)}
      data-unica-skeleton-shape={shape === 'circle' ? 'circle' : undefined}
      aria-hidden="true"
      contentEditable={false}
      style={{
        ...style,
        inlineSize: dimension(width) ?? style?.inlineSize,
        blockSize: dimension(height) ?? style?.blockSize,
      }}
    />
  );
}

/**
 * Multi-line decorative text loading placeholder sized to Unica typography scale tokens.
 */
export function SkeletonText({
  ref,
  size = 'body-m',
  lines = 3,
  width,
  hidden,
  className,
  style,
  id,
  dir,
  ...props
}: SkeletonTextProps): ReactElement {
  const rootRef = useSkeletonSweep(ref);
  const step: SkeletonTextSize = Object.hasOwn(SKELETON_TEXT_SIZE, size) ? size : 'body-m';
  if (typeof lines !== 'number' || !Number.isInteger(lines) || lines < 1 || lines > 20) {
    warnOnce(
      'skeleton-text-lines',
      `SkeletonText lines must be an integer between 1 and 20; received ${String(lines)}.`,
    );
  }
  const count =
    typeof lines === 'number' && Number.isFinite(lines)
      ? Math.max(1, Math.min(20, Math.floor(lines)))
      : 3;
  const textStyle: CSSProperties & {
    '--_skeleton-font-size': string;
    '--_skeleton-line-height': string;
  } = {
    ...style,
    inlineSize: dimension(width) ?? style?.inlineSize,
    '--_skeleton-font-size': `var(--text-size-${step})`,
    '--_skeleton-line-height': `var(--text-size-${step}-lh)`,
  };

  return (
    <div
      {...pickConsumerDataAttributes(props, 'data-unica-skeleton-')}
      ref={rootRef}
      id={id}
      dir={dir}
      hidden={hidden}
      className={cx('unica-skeleton-text', className)}
      aria-hidden="true"
      contentEditable={false}
      style={textStyle}
    >
      {Array.from({ length: count }, (_, index) => (
        <span className="unica-skeleton-text-line" key={index}>
          <span className="unica-skeleton-text-bar" />
        </span>
      ))}
    </div>
  );
}

import type { CSSProperties, ReactElement, Ref } from 'react';
import type { TextSize, TitleSize } from '@docouno/unica';
import './skeleton.css';

// Visual primitives only. Timing, request state, and announcements belong to the host.
interface PlaceholderProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly hidden?: boolean;
  readonly width?: CSSProperties['inlineSize'];
}

export interface SkeletonProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLSpanElement>;
  readonly shape?: 'rect' | 'circle';
  readonly height?: CSSProperties['blockSize'];
  readonly 'data-wb-subject'?: '';
}

export function Skeleton({
  ref,
  shape = 'rect',
  width,
  height,
  hidden,
  className = '',
  style,
  'data-wb-subject': subject,
}: SkeletonProps): ReactElement {
  return (
    <span
      ref={ref}
      className={`skeleton-proto ${className}`}
      data-shape={shape}
      data-wb-subject={subject}
      hidden={hidden}
      aria-hidden="true"
      contentEditable={false}
      style={{ inlineSize: width, blockSize: height, ...style }}
    />
  );
}

export type SkeletonTextSize = Exclude<TextSize, 'body-xs'> | TitleSize;

export interface SkeletonTextProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly size?: SkeletonTextSize;
  readonly lines?: number;
}

export function SkeletonText({
  ref,
  size = 'body-m',
  lines = 3,
  width,
  hidden,
  className = '',
  style,
}: SkeletonTextProps): ReactElement {
  const count = Number.isFinite(lines) ? Math.max(1, Math.min(20, Math.floor(lines))) : 3;
  return (
    <div
      ref={ref}
      className={`skeleton-text-proto ${className}`}
      data-size={size}
      hidden={hidden}
      aria-hidden="true"
      contentEditable={false}
      style={
        {
          '--skeleton-font-size': `var(--text-size-${size})`,
          '--skeleton-line-height': `var(--text-size-${size}-lh)`,
          inlineSize: width,
          ...style,
        } as CSSProperties
      }
    >
      {Array.from({ length: count }, (_, index) => (
        <span className="skeleton-text-line-proto" key={index}>
          <span className="skeleton-proto" />
        </span>
      ))}
    </div>
  );
}

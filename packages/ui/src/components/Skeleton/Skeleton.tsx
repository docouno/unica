import type { CSSProperties, HTMLAttributes, ReactElement, Ref } from 'react';
import { useSkeletonSweep } from './sweep.js';
import './skeleton.css';

interface PlaceholderProps {
  readonly children?: never;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly id?: string | undefined;
  readonly dir?: HTMLAttributes<HTMLElement>['dir'];
  readonly hidden?: boolean | undefined;
  readonly width?: CSSProperties['inlineSize'];
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
}

export interface SkeletonProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLSpanElement> | undefined;
  readonly shape?: 'rect' | 'circle' | undefined;
  readonly height?: CSSProperties['blockSize'];
}

const textSizes = [
  'caption-s',
  'caption-m',
  'caption-l',
  'body-s',
  'body-m',
  'body-l',
  'heading-s',
  'heading-m',
  'heading-l',
  'heading-xl',
  'display-s',
  'display-m',
  'display-l',
] as const;

export interface SkeletonTextProps extends PlaceholderProps {
  readonly ref?: Ref<HTMLDivElement> | undefined;
  readonly size?: (typeof textSizes)[number] | undefined;
  readonly lines?: number | undefined;
}

function dimension(value: CSSProperties['inlineSize']): CSSProperties['inlineSize'] {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function dataAttributes(props: Record<string, unknown>): Record<string, string | number | boolean> {
  // Forward instrumentation without letting a JavaScript spread change the decorative DOM.
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key.startsWith('data-') &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    ) {
      attributes[key] = value;
    }
  }
  return attributes;
}

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
  const classes = ['unica-skeleton', shape === 'circle' && 'unica-skeleton--circle', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span
      {...dataAttributes(props)}
      ref={rootRef}
      id={id}
      dir={dir}
      hidden={hidden}
      className={classes}
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
  const step = textSizes.includes(size) ? size : 'body-m';
  const count = Number.isFinite(lines) ? Math.max(1, Math.min(20, Math.floor(lines))) : 3;
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
      {...dataAttributes(props)}
      ref={rootRef}
      id={id}
      dir={dir}
      hidden={hidden}
      className={className ? `unica-skeleton-text ${className}` : 'unica-skeleton-text'}
      aria-hidden="true"
      contentEditable={false}
      style={textStyle}
    >
      {Array.from({ length: count }, (_, index) => (
        <span className="unica-skeleton-text__line" key={index}>
          <span className="unica-skeleton-text__bar" />
        </span>
      ))}
    </div>
  );
}

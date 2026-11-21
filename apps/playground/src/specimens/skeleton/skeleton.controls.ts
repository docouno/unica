import type { SkeletonTextProps } from '@docouno/unica';
import type { Values } from '../../workbench/types.js';

export type TextStep = NonNullable<SkeletonTextProps['size']>;

export const textSizes: readonly TextStep[] = [
  'display-l',
  'display-m',
  'display-s',
  'heading-xl',
  'heading-l',
  'heading-m',
  'heading-s',
  'body-l',
  'body-m',
  'body-s',
  'caption-l',
  'caption-m',
  'caption-s',
];

export const widthControl = {
  kind: 'string',
  group: 'Geometry',
  default: '',
  description: 'Inline size. Enter pixels or a CSS size. Leave blank for the default.',
  examples: ['', '32', '60%'],
} as const;

export function dimension(input: string): string | number | undefined {
  const value = input.trim();
  if (value === '') {
    return undefined;
  }
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(value)) {
    const pixels = Number(value);
    return Number.isFinite(pixels) && pixels >= 0 ? pixels : undefined;
  }
  return value;
}

export function propValues({ width, height, ...props }: Values): Values {
  const inlineSize = typeof width === 'string' ? dimension(width) : undefined;
  const blockSize = typeof height === 'string' ? dimension(height) : undefined;
  return {
    ...props,
    ...(inlineSize === undefined ? {} : { width: inlineSize }),
    ...(blockSize === undefined ? {} : { height: blockSize }),
  };
}

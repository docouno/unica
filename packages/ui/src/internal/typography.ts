import type { CSSProperties } from 'react';
import type { TEXT_ALIGN, TEXT_COLOR, TYPOGRAPHY_WEIGHT } from '../consts.js';
import { warnOnce } from '../core/devWarning.js';
import type { ExactAxisSubset } from '../types.js';

export const TEXT_COLOR_VALUES = {
  inherit: 'inherit',
  primary: 'primary',
  secondary: 'secondary',
  muted: 'muted',
  subtle: 'subtle',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export type TextColor = ExactAxisSubset<
  typeof TEXT_COLOR,
  typeof TEXT_COLOR_VALUES
>[keyof typeof TEXT_COLOR_VALUES];

export type TextAlign = (typeof TEXT_ALIGN)[keyof typeof TEXT_ALIGN];

export type TypographyWeight = (typeof TYPOGRAPHY_WEIGHT)[keyof typeof TYPOGRAPHY_WEIGHT];

export interface TypographyProps {
  readonly color?: TextColor | undefined;
  readonly align?: TextAlign | undefined;
  readonly italic?: boolean | undefined;
  readonly tabularNums?: boolean | undefined;
  readonly truncate?: boolean | undefined;
  readonly lineClamp?: number | undefined;
}

const weights: Readonly<Record<TypographyWeight, number>> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

type TypographyStyle = CSSProperties & {
  '--_type-size': string;
  '--_type-line-height': string;
  '--_type-weight': number;
};

interface TypographyPresentation {
  readonly 'data-unica-type-color': TextColor | undefined;
  readonly 'data-unica-type-align': TextAlign | undefined;
  readonly 'data-unica-type-style': 'italic' | 'normal' | undefined;
  readonly 'data-unica-type-numeric': '' | undefined;
  readonly 'data-unica-type-overflow': 'clamp' | 'truncate' | undefined;
  readonly style: TypographyStyle;
}

export function typographyPresentation(
  size: string,
  weight: TypographyWeight,
  { color, align, italic, tabularNums, truncate, lineClamp }: TypographyProps,
  style: CSSProperties | undefined,
): TypographyPresentation {
  if (lineClamp !== undefined && (!Number.isInteger(lineClamp) || lineClamp <= 0)) {
    warnOnce(
      'typography-line-clamp',
      `lineClamp must be a positive integer; received ${String(lineClamp)}.`,
    );
  }
  const clamp =
    lineClamp !== undefined && Number.isInteger(lineClamp) && lineClamp > 0 ? lineClamp : undefined;

  return {
    'data-unica-type-color': color === 'inherit' ? undefined : color,
    'data-unica-type-align': align,
    'data-unica-type-style': italic === undefined ? undefined : italic ? 'italic' : 'normal',
    'data-unica-type-numeric': tabularNums ? '' : undefined,
    'data-unica-type-overflow': clamp !== undefined ? 'clamp' : truncate ? 'truncate' : undefined,
    style: {
      '--_type-size': `var(--text-size-${size})`,
      '--_type-line-height': `var(--text-size-${size}-lh)`,
      '--_type-weight': weights[weight],
      ...style,
      // CSS integers are bounded by the browser. Keep even very large values valid CSS.
      ...(clamp === undefined ? {} : { WebkitLineClamp: Math.min(clamp, 2147483647) }),
    },
  };
}

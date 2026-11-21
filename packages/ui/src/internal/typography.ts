import type { CSSProperties } from 'react';

export type TextColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'subtle'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type TextAlign = 'start' | 'center' | 'end';

export interface TypographyProps {
  readonly color?: TextColor | undefined;
  readonly align?: TextAlign | undefined;
  readonly italic?: boolean | undefined;
  readonly tabularNums?: boolean | undefined;
  readonly truncate?: boolean | undefined;
  readonly lineClamp?: number | undefined;
}

const weights = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

export type TypographyWeight = keyof typeof weights;

type TypographyStyle = CSSProperties & {
  '--unica-type-size': string;
  '--unica-type-line-height': string;
  '--unica-type-weight': number;
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
  const clamp =
    lineClamp !== undefined && Number.isInteger(lineClamp) && lineClamp > 0 ? lineClamp : undefined;

  return {
    'data-unica-type-color': color === 'inherit' ? undefined : color,
    'data-unica-type-align': align,
    'data-unica-type-style': italic === undefined ? undefined : italic ? 'italic' : 'normal',
    'data-unica-type-numeric': tabularNums ? '' : undefined,
    'data-unica-type-overflow': clamp !== undefined ? 'clamp' : truncate ? 'truncate' : undefined,
    style: {
      '--unica-type-size': `var(--text-size-${size})`,
      '--unica-type-line-height': `var(--text-size-${size}-lh)`,
      '--unica-type-weight': weights[weight],
      ...style,
      // CSS integers are bounded by the browser. Keep even very large values valid CSS.
      ...(clamp === undefined ? {} : { WebkitLineClamp: Math.min(clamp, 2147483647) }),
    },
  };
}

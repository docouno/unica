import { createElement } from 'react';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { typographyStyle, validClamp } from './typography.utils.js';
import './text.css';

export type TextSize = 'body-l' | 'body-m' | 'body-s' | 'caption-l' | 'caption-m' | 'caption-s';
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
export type TextWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  readonly as?: 'p' | 'span' | 'div' | 'label' | 'strong' | 'em';
  readonly htmlFor?: string;
  readonly ref?: Ref<HTMLElement>;
  readonly size?: TextSize;
  readonly weight?: TextWeight;
  readonly color?: TextColor;
  readonly align?: 'left' | 'center' | 'right';
  readonly italic?: boolean;
  readonly truncate?: boolean;
  readonly lineClamp?: number;
}

// Visual prototype. The library's discriminated native-prop API ships in Wave 2.
export function Text({
  as = 'p',
  size = 'body-m',
  weight,
  color = 'inherit',
  align,
  italic,
  truncate = false,
  lineClamp,
  className = '',
  style,
  htmlFor,
  ...rest
}: TextProps): ReactElement {
  const clamp = validClamp(lineClamp);
  return createElement(as, {
    ...rest,
    ...(as === 'label' ? { htmlFor } : {}),
    className: `type-proto text-proto ${className}`,
    'data-overflow': clamp ? 'clamp' : truncate ? 'truncate' : undefined,
    style: {
      ...typographyStyle(size, weight ?? (as === 'strong' ? 'bold' : 'regular'), color),
      textAlign: align,
      fontStyle: (italic ?? as === 'em') ? 'italic' : 'normal',
      ...style,
      ...(clamp ? { WebkitLineClamp: clamp } : {}),
    },
  });
}

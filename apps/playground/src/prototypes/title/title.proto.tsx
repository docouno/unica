import { createElement } from 'react';
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { typographyStyle, validClamp } from '../text/typography.utils.js';
import '../text/text.css';
import type { TextColor } from '../text/text.proto.js';
import './title.css';

export type TitleSize =
  | 'display-l'
  | 'display-m'
  | 'display-s'
  | 'heading-xl'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'body-m';
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
const defaultSizes: Record<HeadingTag, TitleSize> = {
  h1: 'display-s',
  h2: 'heading-xl',
  h3: 'heading-l',
  h4: 'heading-m',
  h5: 'heading-s',
  h6: 'body-m',
};

export interface TitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  readonly as?: HeadingTag;
  readonly ref?: Ref<HTMLHeadingElement>;
  readonly size?: TitleSize;
  readonly weight?: 'medium' | 'semibold' | 'bold';
  readonly color?: TextColor;
  readonly align?: 'left' | 'center' | 'right';
  readonly textWrap?: 'wrap' | 'nowrap' | 'pretty' | 'balance';
  readonly truncate?: boolean;
  readonly lineClamp?: number;
}

export function Title({
  as = 'h1',
  size = defaultSizes[as],
  weight = 'semibold',
  color = 'inherit',
  align,
  textWrap = 'wrap',
  truncate = false,
  lineClamp,
  className = '',
  style,
  ...rest
}: TitleProps): ReactElement {
  const clamp = validClamp(lineClamp);
  return createElement(as, {
    ...rest,
    className: `type-proto title-proto ${className}`,
    'data-size': size,
    'data-wrap': textWrap,
    'data-overflow': clamp ? 'clamp' : truncate ? 'truncate' : undefined,
    style: {
      ...typographyStyle(size, weight, color),
      textAlign: align,
      ...style,
      ...(clamp ? { WebkitLineClamp: clamp } : {}),
    },
  });
}

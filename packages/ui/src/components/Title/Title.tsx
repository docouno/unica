import { createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { typographyPresentation } from '../../internal/typography.js';
import type { TypographyProps } from '../../internal/typography.js';
import '../../internal/typography.css';
import './title.css';

export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TitleSize =
  | 'display-l'
  | 'display-m'
  | 'display-s'
  | 'heading-xl'
  | 'heading-l'
  | 'heading-m'
  | 'heading-s'
  | 'body-m';
export type TitleWeight = 'medium' | 'semibold' | 'bold';
export type TitleTextWrap = 'wrap' | 'nowrap' | 'pretty' | 'balance';

const headingSizes: Record<HeadingTag, TitleSize> = {
  h1: 'display-s',
  h2: 'heading-xl',
  h3: 'heading-l',
  h4: 'heading-m',
  h5: 'heading-s',
  h6: 'body-m',
};

export interface TitleProps
  extends Omit<ComponentPropsWithRef<'h1'>, keyof TypographyProps>, TypographyProps {
  readonly as?: HeadingTag | undefined;
  readonly size?: TitleSize | undefined;
  readonly weight?: TitleWeight | undefined;
  readonly textWrap?: TitleTextWrap | undefined;
}

export function Title({
  as = 'h1',
  size = headingSizes[as],
  weight = 'semibold',
  color,
  align,
  italic,
  tabularNums,
  truncate,
  lineClamp,
  textWrap = 'wrap',
  className,
  style,
  ...nativeProps
}: TitleProps): ReactElement {
  const presentation = typographyPresentation(
    size,
    weight,
    { color, align, italic, tabularNums, truncate, lineClamp },
    style,
  );

  return createElement(as, {
    ...nativeProps,
    ...presentation,
    className: className ? `unica-title ${className}` : 'unica-title',
    'data-unica-title-size': size,
    'data-unica-title-wrap': presentation['data-unica-type-overflow'] ? undefined : textWrap,
  });
}

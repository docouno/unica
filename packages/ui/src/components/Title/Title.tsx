import { createElement } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { typographyPresentation } from '../../internal/typography.js';
import '../../internal/typography.css';
import type { HeadingTag, TitleProps, TitleSize } from './types.js';
import './title.css';

export type { HeadingTag, TitleProps, TitleSize, TitleTextWrap, TitleWeight } from './types.js';

const headingSizes: Readonly<Record<HeadingTag, TitleSize>> = {
  h1: 'display-s',
  h2: 'heading-xl',
  h3: 'heading-l',
  h4: 'heading-m',
  h5: 'heading-s',
  h6: 'body-m',
};

/**
 * Semantic heading (`h1`–`h6`) with display/heading scale tokens, logical alignment,
 * and `textWrap` control (`truncate`/`lineClamp` take precedence over `textWrap`).
 */
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
    className: cx('unica-title', className),
    'data-unica-title-size': size,
    'data-unica-title-wrap': presentation['data-unica-type-overflow'] ? undefined : textWrap,
  });
}

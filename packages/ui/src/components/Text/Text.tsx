import { createElement } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { typographyPresentation } from '../../internal/typography.js';
import '../../internal/typography.css';
import type { TextProps } from './types.js';
import './text.css';

export type { TextAlign, TextColor, TextProps, TextSize, TextTag, TextWeight } from './types.js';

/**
 * Semantic body and caption typography primitive on native HTML elements (`p`, `span`, `div`,
 * `label`, `strong`, `em`) with token scaling, truncation, and line clamping.
 */
export function Text({
  as = 'p',
  size = 'body-m',
  weight = as === 'strong' ? 'bold' : 'regular',
  color,
  align,
  italic = as === 'em',
  tabularNums,
  truncate,
  lineClamp,
  className,
  style,
  htmlFor,
  ...nativeProps
}: TextProps): ReactElement {
  const presentation = typographyPresentation(
    size,
    weight,
    { color, align, italic, tabularNums, truncate, lineClamp },
    style,
  );

  return createElement(as, {
    ...nativeProps,
    ...presentation,
    htmlFor: as === 'label' ? htmlFor : undefined,
    className: cx('unica-text', className),
  });
}

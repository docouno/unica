import { createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { typographyPresentation } from '../../internal/typography.js';
import type { TypographyProps, TypographyWeight } from '../../internal/typography.js';
import '../../internal/typography.css';
import './text.css';

export type { TextAlign, TextColor } from '../../internal/typography.js';

export type TextTag = 'p' | 'span' | 'div' | 'label' | 'strong' | 'em';
export type TextSize =
  'body-l' | 'body-m' | 'body-s' | 'body-xs' | 'caption-l' | 'caption-m' | 'caption-s';
export type TextWeight = TypographyWeight;

type NativeTextProps = {
  [Tag in TextTag]: Omit<ComponentPropsWithRef<Tag>, keyof TypographyProps> &
    (Tag extends 'label'
      ? { readonly as: Tag }
      : { readonly htmlFor?: never } & (Tag extends 'p'
          ? { readonly as?: Tag | undefined }
          : { readonly as: Tag }));
}[TextTag];

export type TextProps = NativeTextProps &
  TypographyProps & {
    readonly size?: TextSize | undefined;
    readonly weight?: TextWeight | undefined;
  };

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
    className: className ? `unica-text ${className}` : 'unica-text',
  });
}

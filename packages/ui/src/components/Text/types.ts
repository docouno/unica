import type { ComponentPropsWithRef } from 'react';
import type { TYPOGRAPHY_STEP } from '../../consts.js';
import type {
  TextAlign,
  TextColor,
  TypographyProps,
  TypographyWeight,
} from '../../internal/typography.js';
import type { ExactAxisSubset } from '../../types.js';
import type { TEXT_SIZE, TEXT_TAG } from './consts.js';

export type { TextAlign, TextColor };

export type TextTag = (typeof TEXT_TAG)[keyof typeof TEXT_TAG];

export type TextSize = ExactAxisSubset<
  typeof TYPOGRAPHY_STEP,
  typeof TEXT_SIZE
>[keyof typeof TEXT_SIZE];

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

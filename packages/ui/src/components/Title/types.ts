import type { ComponentPropsWithRef } from 'react';
import type { TYPOGRAPHY_STEP, TYPOGRAPHY_WEIGHT } from '../../consts.js';
import type { TypographyProps } from '../../internal/typography.js';
import type { ExactAxisSubset } from '../../types.js';
import type { HEADING_TAG, TITLE_SIZE, TITLE_TEXT_WRAP, TITLE_WEIGHT } from './consts.js';

export type HeadingTag = (typeof HEADING_TAG)[keyof typeof HEADING_TAG];

export type TitleSize = ExactAxisSubset<
  typeof TYPOGRAPHY_STEP,
  typeof TITLE_SIZE
>[keyof typeof TITLE_SIZE];

export type TitleWeight = ExactAxisSubset<
  typeof TYPOGRAPHY_WEIGHT,
  typeof TITLE_WEIGHT
>[keyof typeof TITLE_WEIGHT];

export type TitleTextWrap = (typeof TITLE_TEXT_WRAP)[keyof typeof TITLE_TEXT_WRAP];

export interface TitleProps
  extends Omit<ComponentPropsWithRef<'h1'>, keyof TypographyProps>, TypographyProps {
  readonly as?: HeadingTag | undefined;
  readonly size?: TitleSize | undefined;
  readonly weight?: TitleWeight | undefined;
  readonly textWrap?: TitleTextWrap | undefined;
}

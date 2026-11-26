import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { SIZE, TEXT_ALIGN, TEXT_COLOR } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { HeadingTag } from '../Title/index.js';
import type { EMPTY_ALIGN, EMPTY_MEDIA_COLOR, EMPTY_SIZE } from './consts.js';

export type EmptySize = ExactAxisSubset<typeof SIZE, typeof EMPTY_SIZE>[keyof typeof EMPTY_SIZE];
export type EmptyAlign = ExactAxisSubset<
  typeof TEXT_ALIGN,
  typeof EMPTY_ALIGN
>[keyof typeof EMPTY_ALIGN];
export type EmptyMediaColor = ExactAxisSubset<
  typeof TEXT_COLOR,
  typeof EMPTY_MEDIA_COLOR
>[keyof typeof EMPTY_MEDIA_COLOR];

type PartProps<Tag extends 'div' | 'h3' | 'p'> = Omit<
  ComponentPropsWithRef<Tag>,
  'children' | 'color' | 'dangerouslySetInnerHTML'
> & {
  readonly [key: `data-${string}`]: DataAttributeValue;
  readonly children?: ReactNode | undefined;
  readonly dangerouslySetInnerHTML?: never;
};

export interface EmptyProps extends PartProps<'div'> {
  readonly size?: EmptySize | undefined;
  readonly align?: EmptyAlign | undefined;
}

export interface EmptyMediaProps extends PartProps<'div'> {
  readonly icon?: GlyphSource | undefined;
  readonly color?: EmptyMediaColor | undefined;
}

export interface EmptyTitleProps extends PartProps<'h3'> {
  readonly as?: HeadingTag | undefined;
  readonly color?: never;
}

export interface EmptyDescriptionProps extends PartProps<'p'> {
  readonly color?: never;
}

export type EmptyActionsProps = PartProps<'div'>;

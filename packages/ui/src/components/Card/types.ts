import type {
  ComponentPropsWithRef,
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  Ref,
} from 'react';
import type { ORIENTATION, SIZE } from '../../consts.js';
import type { ExactAxisSubset } from '../../types.js';
import type { TitleProps } from '../Title/types.js';
import type {
  CARD_FOOTER_JUSTIFY,
  CARD_MEDIA_FIT,
  CARD_SECTION_PLACEMENT,
  CARD_SIZE,
  CARD_VARIANT,
} from './consts.js';

export type CardVariant = (typeof CARD_VARIANT)[keyof typeof CARD_VARIANT];
export type CardSize = ExactAxisSubset<typeof SIZE, typeof CARD_SIZE>[keyof typeof CARD_SIZE];
export type CardOrientation = (typeof ORIENTATION)[keyof typeof ORIENTATION];
export type CardFooterJustify = (typeof CARD_FOOTER_JUSTIFY)[keyof typeof CARD_FOOTER_JUSTIFY];
export type CardSectionPlacement =
  (typeof CARD_SECTION_PLACEMENT)[keyof typeof CARD_SECTION_PLACEMENT];
export type CardMediaFit = (typeof CARD_MEDIA_FIT)[keyof typeof CARD_MEDIA_FIT];

interface CardOptions {
  readonly variant?: CardVariant | undefined;
  readonly size?: CardSize | undefined;
  readonly orientation?: CardOrientation | undefined;
}

interface NativeCardProps extends CardOptions, ComponentPropsWithRef<'div'> {
  readonly asChild?: false | undefined;
}

interface DelegatedCardProps extends CardOptions, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly asChild: true;
  readonly children: ReactElement;
  readonly ref?: Ref<HTMLElement> | undefined;
}

export type CardProps = NativeCardProps | DelegatedCardProps;
export type CardHeaderProps = ComponentPropsWithRef<'div'>;
export type CardTitleProps = TitleProps;
export type CardDescriptionProps = ComponentPropsWithRef<'p'>;
export type CardActionProps = ComponentPropsWithRef<'div'>;
export type CardBodyProps = ComponentPropsWithRef<'div'>;

export interface CardFooterProps extends ComponentPropsWithRef<'div'> {
  readonly justify?: CardFooterJustify | undefined;
  readonly withBorder?: boolean | undefined;
}

export interface CardSectionProps extends ComponentPropsWithRef<'div'> {
  readonly placement?: CardSectionPlacement | undefined;
  readonly withBorder?: boolean | undefined;
  readonly padded?: boolean | undefined;
}

export interface CardMediaProps extends ComponentPropsWithRef<'div'> {
  readonly aspectRatio?: CSSProperties['aspectRatio'] | undefined;
  readonly fit?: CardMediaFit | undefined;
}

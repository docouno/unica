import type { ComponentPropsWithRef, CSSProperties, ReactElement } from 'react';
import { Title } from '../title/title.proto.js';
import type { TitleProps } from '../title/title.proto.js';
import './card.css';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  readonly variant?: 'default' | 'subtle';
  readonly size?: 's' | 'm' | 'l';
  readonly orientation?: 'vertical' | 'horizontal';
}

// Visual anatomy only; host delegation and exact public signatures ship separately.
export function Card({
  variant = 'default',
  size = 'm',
  orientation = 'vertical',
  className = '',
  ...props
}: CardProps): ReactElement {
  return (
    <div
      {...props}
      className={`card-proto ${className}`}
      data-variant={variant}
      data-size={size}
      data-orientation={orientation}
    />
  );
}

export function CardHeader({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-header-proto ${className}`} />;
}

export function CardTitle({
  as = 'h3',
  size = 'body-m',
  className = '',
  ...props
}: TitleProps): ReactElement {
  return <Title {...props} as={as} size={size} className={`card-title-proto ${className}`} />;
}

export function CardDescription({
  className = '',
  ...props
}: ComponentPropsWithRef<'p'>): ReactElement {
  return <p {...props} className={`card-description-proto ${className}`} />;
}

export function CardAction({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-action-proto ${className}`} />;
}

export function CardBody({ className = '', ...props }: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-body-proto ${className}`} />;
}

export interface CardFooterProps extends ComponentPropsWithRef<'div'> {
  readonly justify?: 'start' | 'end' | 'between';
  readonly withBorder?: boolean;
}

export function CardFooter({
  justify = 'between',
  withBorder = false,
  className = '',
  ...props
}: CardFooterProps): ReactElement {
  return (
    <div
      {...props}
      className={`card-footer-proto ${className}`}
      data-justify={justify}
      data-bordered={withBorder || undefined}
    />
  );
}

export interface CardSectionProps extends ComponentPropsWithRef<'div'> {
  readonly placement?: 'flush' | 'inset';
  readonly withBorder?: boolean;
  readonly padded?: boolean;
}

export function CardSection({
  placement = 'flush',
  withBorder = false,
  padded = false,
  className = '',
  ...props
}: CardSectionProps): ReactElement {
  return (
    <div
      {...props}
      className={`card-section-proto ${className}`}
      data-placement={placement}
      data-bordered={withBorder || undefined}
      data-padded={padded || undefined}
    />
  );
}

export interface CardMediaProps extends ComponentPropsWithRef<'div'> {
  readonly aspectRatio?: CSSProperties['aspectRatio'];
  readonly fit?: 'cover' | 'contain';
}

export function CardMedia({
  aspectRatio,
  fit = 'cover',
  className = '',
  style,
  ...props
}: CardMediaProps): ReactElement {
  return (
    <div
      {...props}
      className={`card-media-proto ${className}`}
      data-fit={fit}
      data-ratio={aspectRatio ? true : undefined}
      style={{ ...style, aspectRatio }}
    />
  );
}

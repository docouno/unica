import type { ComponentPropsWithRef, ReactElement } from 'react';
import './card.css';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  readonly variant?: 'default' | 'subtle';
  readonly size?: 's' | 'm' | 'l';
}

export function Card({
  variant = 'default',
  size = 'm',
  className = '',
  ...props
}: CardProps): ReactElement {
  return (
    <div {...props} className={`card-proto ${className}`} data-variant={variant} data-size={size} />
  );
}

export function CardHeader({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-header-proto ${className}`} />;
}

export function CardFooter({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-footer-proto ${className}`} />;
}

export function CardMedia({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`card-media-proto ${className}`} />;
}

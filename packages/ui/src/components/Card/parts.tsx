import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { Title } from '../Title/index.js';
import type {
  CardActionProps,
  CardBodyProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardSectionProps,
  CardTitleProps,
} from './types.js';
import './card.css';

/** Lays out the title and description beside an optional compact action. */
export function CardHeader({ className, ...props }: CardHeaderProps): ReactElement {
  return <div {...props} className={cx('unica-card-header', className)} />;
}

/** Semantic heading with a compact default size independent of the card surface size. */
export function CardTitle({
  as = 'h3',
  size = 'body-m',
  className,
  ...props
}: CardTitleProps): ReactElement {
  return <Title {...props} as={as} size={size} className={cx('unica-card-title', className)} />;
}

/** Secondary paragraph accompanying a card title. */
export function CardDescription({ className, ...props }: CardDescriptionProps): ReactElement {
  return <p {...props} className={cx('unica-card-description', className)} />;
}

/** Compact inline-end slot for a header action or badge. */
export function CardAction({ className, ...props }: CardActionProps): ReactElement {
  return <div {...props} className={cx('unica-card-action', className)} />;
}

/** Flexible content group, also used next to the media in a horizontal card. */
export function CardBody({ className, ...props }: CardBodyProps): ReactElement {
  return <div {...props} className={cx('unica-card-body', className)} />;
}

/** Wrapping row for metadata or actions, with optional separation from the content. */
export function CardFooter({
  justify = 'between',
  withBorder = false,
  className,
  ...props
}: CardFooterProps): ReactElement {
  return (
    <div
      {...props}
      className={cx('unica-card-footer', className)}
      data-unica-card-justify={justify}
      data-unica-card-footer-bordered={dataFlag(withBorder)}
    />
  );
}

/** Inset or edge-to-edge region with optional padding and dividers. */
export function CardSection({
  placement = 'flush',
  withBorder = false,
  padded = false,
  className,
  ...props
}: CardSectionProps): ReactElement {
  return (
    <div
      {...props}
      className={cx('unica-card-section', className)}
      data-unica-card-placement={placement}
      data-unica-card-section-bordered={dataFlag(withBorder)}
      data-unica-card-padded={dataFlag(padded)}
    />
  );
}

/** Clipped frame for media or its fallback, with an optional reserved aspect ratio. */
export function CardMedia({
  aspectRatio,
  fit = 'cover',
  className,
  style,
  ...props
}: CardMediaProps): ReactElement {
  return (
    <div
      {...props}
      className={cx('unica-card-media', className)}
      data-unica-card-fit={fit}
      style={aspectRatio === undefined ? style : { ...style, aspectRatio }}
    />
  );
}

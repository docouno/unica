import type { JSX } from 'react';
import { cx } from '../../core/cx.js';
import type {
  ChoiceCardContentProps,
  ChoiceCardDescriptionProps,
  ChoiceCardLabelProps,
  ChoiceCardMetadataProps,
  ChoiceCardSecondaryProps,
} from './types.js';

/** Lays out the title, description, metadata, and secondary actions of a choice. */
export function ChoiceCardContent({ className, ...props }: ChoiceCardContentProps): JSX.Element {
  return <div {...props} className={cx('unica-choice-card-content', className)} />;
}

/** Renders the title that names the choice when referenced by the input. */
export function ChoiceCardLabel({ className, ...props }: ChoiceCardLabelProps): JSX.Element {
  return <span {...props} className={cx('unica-choice-card-label', className)} />;
}

/** Renders supporting copy that can be referenced by the input. */
export function ChoiceCardDescription({
  className,
  ...props
}: ChoiceCardDescriptionProps): JSX.Element {
  return <span {...props} className={cx('unica-choice-card-description', className)} />;
}

/** Renders passive option details such as a price or badge. */
export function ChoiceCardMetadata({ className, ...props }: ChoiceCardMetadataProps): JSX.Element {
  return <div {...props} className={cx('unica-choice-card-metadata', className)} />;
}

/** Places links and buttons above the primary activation label, with their own hit targets. */
export function ChoiceCardSecondary({
  className,
  ...props
}: ChoiceCardSecondaryProps): JSX.Element {
  return (
    <div
      {...props}
      className={cx('unica-choice-card-secondary', className)}
      data-unica-choice-card-secondary=""
    />
  );
}

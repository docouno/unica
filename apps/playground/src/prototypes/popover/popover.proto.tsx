import type { ComponentPropsWithRef, ReactElement } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import type { TextProps } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import type { TitleProps } from '../title/title.proto.js';
import './popover.css';
import '../scrollbar/scrollbar.css';

export type PopoverSize = 's' | 'm' | 'l';
export type PopoverSide = 'top' | 'bottom' | 'start' | 'end';
export type PopoverAlign = 'start' | 'center' | 'end';

// In-flow composition for simultaneous material studies. See the separate live harness.
export function Popover({ className = '', ...props }: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`popover-proto ${className}`} />;
}

export interface PopoverContentProps extends ComponentPropsWithRef<'div'> {
  readonly size?: PopoverSize;
}

export function PopoverContent({
  size = 'm',
  className = '',
  ...props
}: PopoverContentProps): ReactElement {
  return (
    <div
      role="dialog"
      {...props}
      className={`popover-content-proto ${className}`}
      data-size={size}
      data-surface="overlay"
    />
  );
}

export function PopoverTitle({ className = '', ...props }: TitleProps): ReactElement {
  return (
    <Title as="h3" size="heading-s" {...props} className={`popover-title-proto ${className}`} />
  );
}

export function PopoverDescription({ className = '', ...props }: TextProps): ReactElement {
  return (
    <Text
      size="body-s"
      color="secondary"
      {...props}
      className={`popover-description-proto ${className}`}
    />
  );
}

// Layout slots describe the design anatomy, not a committed library API.
export function PopoverHeader({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`popover-header-proto ${className}`} />;
}

export function PopoverBody({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`popover-body-proto scrollbar-proto ${className}`} />;
}

export function PopoverFooter({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div {...props} className={`popover-footer-proto ${className}`} />;
}

export interface PopoverCloseProps extends ComponentPropsWithRef<'button'> {
  /** Pins appearance for the state study; does not move DOM focus. */
  readonly previewState?: 'rest' | 'hover' | 'active' | 'focus';
}

export function PopoverClose({
  className = '',
  children,
  previewState,
  ...props
}: PopoverCloseProps): ReactElement {
  return (
    <button
      type="button"
      aria-label="Close popover"
      {...props}
      className={`popover-close-proto ${className}`}
      data-preview={previewState}
    >
      {children ?? <XIcon size="1em" aria-hidden="true" />}
    </button>
  );
}

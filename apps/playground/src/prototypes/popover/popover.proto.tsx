import type { ComponentPropsWithRef, ReactElement } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import type { TextProps } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import type { TitleProps } from '../title/title.proto.js';
import './popover.css';

export type PopoverSize = 's' | 'm' | 'l';
export type PopoverSide = 'top' | 'bottom' | 'start' | 'end';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps extends ComponentPropsWithRef<'div'> {
  readonly side?: PopoverSide;
  readonly align?: PopoverAlign;
}

// In-flow visual composition only. Native top layer and positioning ship in Wave 2.
export function Popover({
  side = 'bottom',
  align = 'center',
  className = '',
  ...props
}: PopoverProps): ReactElement {
  return (
    <div {...props} className={`popover-proto ${className}`} data-side={side} data-align={align} />
  );
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

export type PopoverCloseProps = ComponentPropsWithRef<'button'>;

export function PopoverClose({
  className = '',
  children,
  ...props
}: PopoverCloseProps): ReactElement {
  return (
    <button
      type="button"
      aria-label="Close popover"
      {...props}
      className={`popover-close-proto ${className}`}
    >
      {children ?? <XIcon size="1em" aria-hidden="true" />}
    </button>
  );
}

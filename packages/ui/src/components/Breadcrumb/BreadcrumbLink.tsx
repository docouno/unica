import type { MouseEvent, ReactElement } from 'react';
import { Slot, resolveSlotProps } from '../../core/Slot.js';
import {
  fallbackAnchorAttributes,
  fallbackAnchorChild,
  requireAnchorChild,
  secureRel,
} from '../../core/anchor.js';
import type { AnchorProps } from '../../core/anchor.js';
import { cx, dataFlag } from '../../core/cx.js';
import type { BreadcrumbLinkProps } from './types.js';
import './breadcrumb.css';

function blockActivation(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  event.stopPropagation();
}

/** Ancestor link or explicit current permalink with native anchor and router composition. */
export function BreadcrumbLink({
  asChild,
  children,
  className,
  disabled = false,
  href,
  iconOnly = false,
  ref,
  underline,
  dangerouslySetInnerHTML,
  ...props
}: BreadcrumbLinkProps): ReactElement {
  const child = asChild ? requireAnchorChild(children, disabled, 'BreadcrumbLink') : undefined;
  if (dangerouslySetInnerHTML !== undefined) {
    throw new Error('BreadcrumbLink requires its label to be supplied as ordinary children.');
  }
  if (!disabled && !asChild && typeof href !== 'string') {
    throw new Error('An enabled BreadcrumbLink requires a string href.');
  }

  const anchorClass = cx('unica-breadcrumb-link', className);
  const owned = {
    'data-unica-breadcrumb-underline': underline,
    'data-unica-breadcrumb-icon-only': dataFlag(iconOnly),
    'aria-disabled': disabled || undefined,
  } as const;

  if (!disabled) {
    const effective = child
      ? (resolveSlotProps({
          slotProps: { target: props.target, rel: props.rel },
          childProps: { target: child.props.target, rel: child.props.rel },
        }) as Pick<AnchorProps, 'target' | 'rel'>)
      : props;
    const blank =
      typeof effective.target === 'string' && effective.target.toLowerCase() === '_blank';
    const rel = blank ? secureRel(effective.rel) : effective.rel;

    if (child) {
      return (
        <Slot<HTMLAnchorElement>
          {...props}
          className={anchorClass}
          ref={ref}
          slotOwned={{ ...owned, rel }}
        >
          {child}
        </Slot>
      );
    }

    return (
      <a {...props} {...owned} href={href} rel={rel} className={anchorClass} ref={ref}>
        {children}
      </a>
    );
  }

  const unavailable = {
    ...owned,
    role: 'link',
    onClickCapture: blockActivation,
    onAuxClickCapture: blockActivation,
  } as const;
  const passiveProps = fallbackAnchorAttributes(props);
  if (child) {
    return (
      <Slot<HTMLAnchorElement>
        {...passiveProps}
        className={anchorClass}
        ref={ref}
        slotOwned={unavailable}
        slotContent={child.props.children}
      >
        {fallbackAnchorChild(child)}
      </Slot>
    );
  }

  return (
    <a {...passiveProps} {...unavailable} className={anchorClass} ref={ref}>
      {children}
    </a>
  );
}

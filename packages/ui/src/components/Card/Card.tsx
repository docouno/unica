import type { ReactElement } from 'react';
import { Slot } from '../../core/Slot.js';
import { cx } from '../../core/cx.js';
import { requireCardHost, useCardHostRef } from './host.js';
import type { CardProps } from './types.js';
import './card.css';

/** Bounded neutral surface for an entity, with optional delegation to a semantic host. */
export function Card({
  asChild,
  variant = 'default',
  size = 'm',
  orientation = 'vertical',
  className,
  children,
  ref,
  ...nativeProps
}: CardProps): ReactElement {
  const hostRef = useCardHostRef(asChild ? ref : undefined, asChild === true);
  const owned = {
    'data-unica-card-variant': variant,
    'data-unica-card-size': size,
    'data-unica-card-orientation': orientation,
  };
  const rootClass = cx('unica-card', className);

  if (asChild) {
    const child = requireCardHost(children, nativeProps['aria-labelledby']);
    return (
      <Slot {...nativeProps} className={rootClass} ref={hostRef} slotOwned={owned}>
        {child}
      </Slot>
    );
  }

  return (
    <div {...nativeProps} {...owned} className={rootClass} ref={ref}>
      {children}
    </div>
  );
}

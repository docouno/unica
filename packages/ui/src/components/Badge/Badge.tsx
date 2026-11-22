import { Children, Fragment, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Slot } from '../../core/Slot.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { Icon } from '../Icon/Icon.js';
import type { BadgeProps } from './types.js';
import './badge.css';

export type { BadgeProps, BadgeStatus } from './types.js';

type BadgeChild = ReactElement<
  Pick<HTMLAttributes<HTMLElement>, 'children' | 'dangerouslySetInnerHTML'> & { type?: string },
  'a' | 'button'
>;

function requireBadgeChild(child: unknown): BadgeChild {
  if (
    !isValidElement<BadgeChild['props']>(child) ||
    (child.type !== 'a' && child.type !== 'button')
  ) {
    throw new Error('Badge with asChild requires exactly one native <a> or <button> child.');
  }
  if (child.props.dangerouslySetInnerHTML) {
    throw new Error('Badge with asChild requires the native element label as children.');
  }
  return child as BadgeChild;
}

function hasLabel(label: ReactNode): boolean {
  return Children.toArray(label).some((part) => {
    if (typeof part === 'string') {
      return part.trim().length > 0;
    }
    if (isValidElement<{ children?: ReactNode }>(part)) {
      return part.type === Fragment || typeof part.type === 'string'
        ? hasLabel(part.props.children)
        : true;
    }
    return typeof part === 'number' || typeof part === 'bigint';
  });
}

/**
 * Compact status or count badge. Renders nothing when its label has no visible content;
 * `iconLeft` takes precedence over `dot`.
 */
export function Badge({
  asChild,
  children,
  status = 'neutral',
  size = 'm',
  dot = false,
  iconLeft,
  ref,
  className,
  ...props
}: BadgeProps): ReactElement | null {
  const child = asChild ? requireBadgeChild(children) : undefined;
  const label = child ? child.props.children : children;
  if (!hasLabel(label)) {
    if (typeof label === 'string' && label.length > 0) {
      warnOnce(
        'badge-blank-children',
        'Badge received whitespace-only children and rendered nothing.',
      );
    }
    return null;
  }

  const numeric =
    !dot &&
    !iconLeft &&
    (typeof label === 'number' || (typeof label === 'string' && /^[0-9]+\+?$/u.test(label)));
  const marker = {
    'data-unica-mark-status': status,
    'data-unica-badge-size': size,
    'data-unica-badge-numeric': dataFlag(numeric),
  };
  const rootClass = cx('unica-badge', className);
  const content = (
    <>
      {iconLeft ? (
        <Icon className="unica-badge-icon" usage="slot" icon={iconLeft} size={size} />
      ) : dot ? (
        <span className="unica-badge-dot" aria-hidden="true" />
      ) : null}
      <span className="unica-badge-label">
        <span className="unica-badge-text" dir="auto">
          {label}
        </span>
      </span>
    </>
  );

  if (child) {
    return (
      <Slot
        {...props}
        className={rootClass}
        ref={ref}
        slotDefaults={child.type === 'button' ? { type: 'button' } : undefined}
        slotOwned={marker}
        slotContent={content}
      >
        {child}
      </Slot>
    );
  }

  return (
    <span {...props} {...marker} className={rootClass} ref={ref}>
      {content}
    </span>
  );
}

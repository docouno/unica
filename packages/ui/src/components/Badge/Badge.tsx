import { Children, Fragment, cloneElement, isValidElement } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Slot } from '../../core/Slot.js';
import { Icon } from '../Icon/Icon.js';
import type { GlyphSource } from '../Icon/glyph.js';
import './badge.css';

export type BadgeStatus = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

interface BadgePresentation {
  readonly status?: BadgeStatus | undefined;
  readonly size?: 's' | 'm' | 'l' | undefined;
  readonly dot?: boolean | undefined;
  readonly iconLeft?: GlyphSource | undefined;
}

interface BadgeRootProps<T extends HTMLElement> extends Omit<
  HTMLAttributes<T>,
  'children' | 'dangerouslySetInnerHTML' | 'style'
> {
  readonly ref?: Ref<T> | undefined;
  readonly style?: (CSSProperties & { readonly '--badge-max-width'?: string }) | undefined;
  readonly dangerouslySetInnerHTML?: never;
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
}

type BadgeChild = ReactElement<
  Pick<HTMLAttributes<HTMLElement>, 'children' | 'dangerouslySetInnerHTML'> & { type?: string },
  'a' | 'button'
>;

export type BadgeProps = BadgePresentation &
  (
    | (BadgeRootProps<HTMLSpanElement> & {
        readonly asChild?: false | undefined;
        readonly children: ReactNode;
      })
    | (BadgeRootProps<HTMLElement> & { readonly asChild: true; readonly children: ReactElement })
  );

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
    return null;
  }

  const numeric =
    !dot &&
    !iconLeft &&
    (typeof label === 'number' || (typeof label === 'string' && /^[0-9]+\+?$/u.test(label)));
  const marker = {
    'data-unica-mark-status': status,
    'data-unica-badge-size': size,
    'data-unica-badge-numeric': numeric || undefined,
  };
  const rootClass = className ? `unica-badge ${className}` : 'unica-badge';
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
    const buttonType =
      child.type === 'button' && child.props.type === undefined ? { type: 'button' } : {};
    return (
      <Slot {...props} {...marker} className={rootClass} ref={ref}>
        {cloneElement(child, { ...buttonType, ...marker }, content)}
      </Slot>
    );
  }

  return (
    <span {...props} {...marker} className={rootClass} ref={ref}>
      {content}
    </span>
  );
}

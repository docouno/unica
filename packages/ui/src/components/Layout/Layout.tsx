import { Children, Fragment, createElement, isValidElement } from 'react';
import type { JSX, ReactNode } from 'react';
import { cx } from '../../core/cx.js';
import { type LayoutStyle, flexAlignment, setResponsive, space } from './responsive.js';
import type {
  BoxProps,
  BoxTag,
  ContainerProps,
  ContainerSize,
  FlexProps,
  SpacingSlot,
  StackProps,
} from './types.js';
import './layout.css';

export type { BoxProps, ContainerProps, FlexProps, StackProps } from './types.js';

const spacingSlots = {
  '': '',
  Inline: '-inline',
  Block: '-block',
  InlineStart: '-inline-start',
  InlineEnd: '-inline-end',
  BlockStart: '-block-start',
  BlockEnd: '-block-end',
} as const satisfies Record<SpacingSlot, string>;

/**
 * Low-level structural container applying responsive logical spacing and display slots
 * on a semantic HTML landmark or block/inline element.
 */
export function Box<Tag extends BoxTag = 'div'>({
  as,
  className,
  display,
  style,
  ...props
}: BoxProps<Tag>): JSX.Element {
  const layout: LayoutStyle = {};
  setResponsive(layout, 'box-display', display);
  for (const group of ['padding', 'margin'] as const) {
    for (const [slot, suffix] of Object.entries(spacingSlots)) {
      const prop = `${group}${slot as SpacingSlot}` as const;
      setResponsive(layout, `box-${group}${suffix}`, props[prop], space);
      delete props[prop];
    }
  }

  return createElement<Record<string, unknown>>(as ?? 'div', {
    ...props,
    className: cx('unica-box', className),
    style: { ...layout, ...style },
  });
}

/**
 * Responsive one-dimensional flexbox layout container with direction, wrap, alignment, and token gap.
 */
export function Flex({
  className,
  style,
  direction,
  align,
  gap,
  wrap,
  justify,
  ...props
}: FlexProps): JSX.Element {
  const layout: LayoutStyle = {};
  setResponsive(layout, 'flow-direction', direction);
  setResponsive(layout, 'flow-align', align, flexAlignment);
  setResponsive(layout, 'flow-gap', gap, space);
  setResponsive(layout, 'flex-wrap', wrap);
  setResponsive(layout, 'flex-justify', justify, flexAlignment);
  return <div {...props} className={cx('unica-flex', className)} style={{ ...layout, ...style }} />;
}

function stackChildren(children: ReactNode): JSX.Element[] {
  const items = Children.map(children, (child) => {
    if (child === null || child === undefined || child === '') {
      return null;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return stackChildren(child.props.children);
    }
    return <Fragment>{child}</Fragment>;
  });
  // Children.map flattens returned arrays and combines keys with their source paths.
  return (items ?? []) as JSX.Element[];
}

/**
 * Responsive flex stack (column by default) that spaces meaningful children and inserts
 * optional `divider` nodes between adjacent non-empty items.
 */
export function Stack({
  className,
  style,
  direction,
  align,
  gap,
  divider,
  children,
  ...props
}: StackProps): JSX.Element {
  const layout: LayoutStyle = {};
  setResponsive(layout, 'flow-direction', direction);
  setResponsive(layout, 'flow-align', align, flexAlignment);
  setResponsive(layout, 'flow-gap', gap, space);

  const items = stackChildren(children);
  const hasDivider = items.length > 1 && stackChildren(divider).length > 0;

  return (
    <div {...props} className={cx('unica-stack', className)} style={{ ...layout, ...style }}>
      {children === null || children === undefined
        ? children
        : items.flatMap((item, index) =>
            hasDivider && index > 0
              ? [<Fragment key={`divider:${item.key}`}>{divider}</Fragment>, item]
              : [item],
          )}
    </div>
  );
}

const containerWidths: Readonly<Record<ContainerSize, string>> = {
  s: 'var(--container-s)',
  m: 'var(--container-m)',
  l: 'var(--container-l)',
};

/**
 * Fluid content column constrained by `--container-{s,m,l}` with responsive inline gutters
 * and optional centering (`centered={false}` aligns to inline start).
 */
export function Container({
  className,
  style,
  size,
  gutter,
  centered = true,
  ...props
}: ContainerProps): JSX.Element {
  const layout: LayoutStyle = {};
  setResponsive(layout, 'container-width', size, (tier) => containerWidths[tier]);
  setResponsive(layout, 'container-gutter', gutter, space);
  return (
    <div
      {...props}
      className={cx('unica-container', className)}
      data-unica-container-align={centered ? undefined : 'start'}
      style={{ ...layout, ...style }}
    />
  );
}

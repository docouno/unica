import { Children, Fragment, createElement, isValidElement } from 'react';
import type { ComponentPropsWithRef, JSX, ReactNode } from 'react';

import {
  type LayoutStyle,
  type Responsive,
  type Spacing,
  flexAlignment,
  layoutClass,
  setResponsive,
  space,
} from './responsive.js';

import './layout.css';

type BoxTag =
  'div' | 'span' | 'section' | 'article' | 'aside' | 'main' | 'header' | 'footer' | 'nav';
type BoxDisplay = 'block' | 'inline' | 'inline-block' | 'flow-root' | 'none';
type SpacingSlot =
  '' | 'Inline' | 'Block' | 'InlineStart' | 'InlineEnd' | 'BlockStart' | 'BlockEnd';
type SpacingProp = `${'padding' | 'margin'}${SpacingSlot}`;
type BoxSpacing = { [Prop in SpacingProp]?: Responsive<Spacing> | undefined };
type BoxRoot<Tag extends BoxTag> = { as: Tag } | ('div' extends Tag ? { as?: undefined } : never);

export type BoxProps<Tag extends BoxTag = 'div'> = BoxSpacing &
  BoxRoot<Tag> & {
    display?: Responsive<BoxDisplay> | undefined;
  } & Omit<ComponentPropsWithRef<NoInfer<Tag>>, 'as' | 'display' | SpacingProp>;

const spacingSlots = {
  '': '',
  Inline: '-inline',
  Block: '-block',
  InlineStart: '-inline-start',
  InlineEnd: '-inline-end',
  BlockStart: '-block-start',
  BlockEnd: '-block-end',
} as const satisfies Record<SpacingSlot, string>;

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
    className: layoutClass('unica-box', className),
    style: { ...layout, ...style },
  });
}

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type Justify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';

interface FlowProps extends ComponentPropsWithRef<'div'> {
  direction?: Responsive<Direction> | undefined;
  align?: Responsive<Align> | undefined;
  gap?: Responsive<Spacing> | undefined;
}

export interface FlexProps extends FlowProps {
  wrap?: Responsive<Wrap> | undefined;
  justify?: Responsive<Justify> | undefined;
}

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
  return (
    <div
      {...props}
      className={layoutClass('unica-flex', className)}
      style={{ ...layout, ...style }}
    />
  );
}

export interface StackProps extends FlowProps {
  divider?: ReactNode;
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
    <div
      {...props}
      className={layoutClass('unica-stack', className)}
      style={{ ...layout, ...style }}
    >
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

type ContainerSize = 's' | 'm' | 'l';
const containerWidths = { s: '720px', m: '960px', l: '1280px' } as const;

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  size?: Responsive<ContainerSize> | undefined;
  gutter?: Responsive<Spacing> | undefined;
  centered?: boolean | undefined;
}

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
      className={layoutClass(
        centered ? 'unica-container' : 'unica-container unica-container--start',
        className,
      )}
      style={{ ...layout, ...style }}
    />
  );
}

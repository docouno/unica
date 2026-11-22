import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { SIZE } from '../../consts.js';
import type { ExactAxisSubset, Spacing } from '../../types.js';
import type {
  BOX_DISPLAY,
  BOX_TAG,
  CONTAINER_SIZE,
  FLEX_ALIGN,
  FLEX_DIRECTION,
  FLEX_JUSTIFY,
  FLEX_WRAP,
  GRID_FLOW,
  VISUALLY_HIDDEN_TAG,
} from './consts.js';

export type { Spacing } from '../../types.js';

export type Responsive<T> =
  | T
  | {
      readonly mobile?: T | undefined;
      readonly tablet?: T | undefined;
      readonly desktop?: T | undefined;
      readonly wide?: T | undefined;
    };

export type BoxTag = (typeof BOX_TAG)[keyof typeof BOX_TAG];
export type BoxDisplay = (typeof BOX_DISPLAY)[keyof typeof BOX_DISPLAY];
export type SpacingSlot =
  '' | 'Inline' | 'Block' | 'InlineStart' | 'InlineEnd' | 'BlockStart' | 'BlockEnd';
export type SpacingProp = `${'padding' | 'margin'}${SpacingSlot}`;

type BoxSpacing = { readonly [Prop in SpacingProp]?: Responsive<Spacing> | undefined };
type BoxRoot<Tag extends BoxTag> =
  { readonly as: Tag } | ('div' extends Tag ? { readonly as?: undefined } : never);

export type BoxProps<Tag extends BoxTag = 'div'> = BoxSpacing &
  BoxRoot<Tag> & {
    readonly display?: Responsive<BoxDisplay> | undefined;
  } & Omit<ComponentPropsWithRef<NoInfer<Tag>>, 'as' | 'display' | SpacingProp>;

export type FlexDirection = (typeof FLEX_DIRECTION)[keyof typeof FLEX_DIRECTION];
export type FlexAlign = (typeof FLEX_ALIGN)[keyof typeof FLEX_ALIGN];
export type FlexWrap = (typeof FLEX_WRAP)[keyof typeof FLEX_WRAP];
export type FlexJustify = (typeof FLEX_JUSTIFY)[keyof typeof FLEX_JUSTIFY];

interface FlowProps extends ComponentPropsWithRef<'div'> {
  readonly direction?: Responsive<FlexDirection> | undefined;
  readonly align?: Responsive<FlexAlign> | undefined;
  readonly gap?: Responsive<Spacing> | undefined;
}

export interface FlexProps extends FlowProps {
  readonly wrap?: Responsive<FlexWrap> | undefined;
  readonly justify?: Responsive<FlexJustify> | undefined;
}

export interface StackProps extends FlowProps {
  readonly divider?: ReactNode;
}

export type ContainerSize = ExactAxisSubset<
  typeof SIZE,
  typeof CONTAINER_SIZE
>[keyof typeof CONTAINER_SIZE];

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  readonly size?: Responsive<ContainerSize> | undefined;
  readonly gutter?: Responsive<Spacing> | undefined;
  readonly centered?: boolean | undefined;
}

export type TrackCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type GridFlow = (typeof GRID_FLOW)[keyof typeof GRID_FLOW];

export interface GridProps extends ComponentPropsWithRef<'div'> {
  readonly columns?: Responsive<TrackCount> | undefined;
  readonly gap?: Responsive<Spacing> | undefined;
  readonly flow?: GridFlow | undefined;
  readonly areas?: readonly string[] | undefined;
}

export type GridItemProps = ComponentPropsWithRef<'div'> &
  (
    | { readonly area: string; readonly span?: never }
    | { readonly area?: undefined; readonly span?: Responsive<TrackCount> | undefined }
  );

export type VisuallyHiddenTag = (typeof VISUALLY_HIDDEN_TAG)[keyof typeof VISUALLY_HIDDEN_TAG];
type VisuallyHiddenRoot<Tag extends VisuallyHiddenTag> =
  { readonly as: Tag } | ('span' extends Tag ? { readonly as?: undefined } : never);

export type VisuallyHiddenProps<Tag extends VisuallyHiddenTag = 'span'> = VisuallyHiddenRoot<Tag> &
  Omit<ComponentPropsWithRef<NoInfer<Tag>>, 'as'>;

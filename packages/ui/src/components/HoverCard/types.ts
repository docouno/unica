import type { ComponentPropsWithoutRef, ReactElement, ReactNode, Ref } from 'react';
import type { PreviewSurfaceProps } from '../../core/hover-preview/surface.js';
import type { PreviewOpenProps } from '../../core/hover-preview/types.js';
import type { Align, Side } from '../../core/overlay/positioning.js';

export interface HoverCardProps extends PreviewOpenProps {
  readonly children: ReactNode;
}

type AnchorAttributes = Omit<
  ComponentPropsWithoutRef<'a'>,
  'children' | 'dangerouslySetInnerHTML' | 'href'
>;

interface NativeTrigger {
  readonly asChild?: false | undefined;
  readonly href: string;
  readonly children?: ReactNode;
}

interface SlottedTrigger {
  readonly asChild: true;
  readonly children: ReactElement;
  readonly href?: never;
}

export type HoverCardTriggerProps = AnchorAttributes &
  (NativeTrigger | SlottedTrigger) & {
    readonly ref?: Ref<HTMLAnchorElement> | undefined;
  };

export interface HoverCardContentProps extends PreviewSurfaceProps<HTMLDivElement> {
  readonly children: ReactNode;
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly ref?: Ref<HTMLDivElement> | undefined;
}

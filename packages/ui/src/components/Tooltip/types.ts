import type { ReactElement, ReactNode, Ref } from 'react';
import type { PreviewSurfaceProps } from '../../core/hover-preview/surface.js';
import type { PreviewOpenProps } from '../../core/hover-preview/types.js';
import type { Align, Side } from '../../core/overlay/positioning.js';

interface TooltipSurfaceProps extends Omit<PreviewSurfaceProps<HTMLSpanElement>, 'children'> {
  readonly label: string;
  readonly shortcut?: string | ReactElement | undefined;
  readonly disabled?: boolean | undefined;
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly collisionPadding?: number | undefined;
  readonly ref?: Ref<HTMLSpanElement> | undefined;
}

interface TooltipWithChild extends PreviewOpenProps {
  readonly children: ReactElement;
  readonly describe?: boolean | undefined;
  readonly anchor?: never;
  readonly avoid?: never;
}

interface TooltipWithAnchor extends Omit<PreviewOpenProps, 'open' | 'defaultOpen'> {
  readonly anchor: HTMLElement | null;
  readonly open: boolean;
  readonly avoid?: HTMLElement | null | undefined;
  readonly children?: never;
  readonly describe?: never;
  readonly defaultOpen?: never;
}

export type TooltipProps = TooltipSurfaceProps & (TooltipWithChild | TooltipWithAnchor);

export interface TooltipProviderProps {
  readonly children: ReactNode;
  readonly delay?: number | undefined;
}

import { createRef } from 'react';
import type { ReactElement } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Tooltip,
  TooltipProvider,
} from '../src/index.js';
import type {
  HoverCardContentProps,
  HoverCardProps,
  HoverCardTriggerProps,
  HoverPreviewChangeDetails,
  TooltipProps,
  TooltipProviderProps,
} from '../src/server.js';

export function hoverPreviewTypes(anchor: HTMLElement | null): ReactElement {
  const onOpenChange = (_open: boolean, { reason }: HoverPreviewChangeDetails): string => reason;
  const anchored: TooltipProps = { anchor, label: 'Unavailable', open: true, onOpenChange };
  const provider: TooltipProviderProps = { children: null, delay: 0 };
  const root: HoverCardProps = { children: null, defaultOpen: true, onOpenChange };
  const trigger: HoverCardTriggerProps = {
    href: '/guide',
    ref: createRef<HTMLAnchorElement>(),
  };
  const content: HoverCardContentProps = {
    children: 'Installation guide',
    side: 'end',
    ref: createRef<HTMLDivElement>(),
  };
  const icon = createRef<SVGSVGElement>();
  const button = <button />;

  // @ts-expect-error The external anchor is controlled by its widget.
  const missingOpen = <Tooltip anchor={anchor} label="Unavailable" />;
  // @ts-expect-error The widget owns descriptions in external-anchor mode.
  const externalDescription = <Tooltip anchor={anchor} label="Unavailable" open describe />;
  // @ts-expect-error A slotted trigger and a supplied anchor are exclusive.
  const twoAnchors: TooltipProps = { anchor, label: 'Full', open: true, children: button };
  // @ts-expect-error The external anchor requires an explicit open value.
  const externalDefault = <Tooltip anchor={anchor} label="Unavailable" open defaultOpen />;
  // @ts-expect-error The child accepts the anchor's href.
  const twoDestinations: HoverCardTriggerProps = { asChild: true, href: '/', children: <a /> };
  // @ts-expect-error The native anchor must have a destination.
  const missingDestination = <HoverCardTrigger>Guide</HoverCardTrigger>;
  // @ts-expect-error The preview owns its tab order.
  const focusable = <HoverCardContent tabIndex={0}>Preview</HoverCardContent>;
  // @ts-expect-error The Tooltip ref is the span surface.
  const invalidRef: TooltipProps = { label: 'Guide', ref: icon, children: button };
  void [
    missingOpen,
    externalDescription,
    twoAnchors,
    externalDefault,
    twoDestinations,
    missingDestination,
    focusable,
    invalidRef,
  ];

  return (
    <TooltipProvider {...provider}>
      <Tooltip {...anchored} />
      <Tooltip label="Guide" describe shortcut="F1" ref={createRef<HTMLSpanElement>()}>
        <button type="button">Help</button>
      </Tooltip>
      <HoverCard {...root}>
        <HoverCardTrigger {...trigger}>Guide</HoverCardTrigger>
        <HoverCardContent {...content} />
      </HoverCard>
    </TooltipProvider>
  );
}

import { offset, platform, shift } from '@floating-ui/dom';
import type { Middleware, Placement, Rect, SideObject } from '@floating-ui/dom';
import { getComputedStyleSafe } from '../dom.js';
import { isConnectedNode, ownerDocumentOf } from './dom.js';

type PhysicalSide = keyof SideObject;

interface Edges {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

interface PreviewLayout {
  readonly anchor: HTMLElement;
  readonly floating: HTMLElement;
  readonly avoid: HTMLElement | null | undefined;
  readonly placement: Placement;
  readonly rtl: boolean;
  readonly gap: number;
  readonly padding: number;
  readonly valid: () => boolean;
  readonly intersection: IntersectionObserverEntry | undefined;
  readonly onUnavailable: () => void;
  readonly setSize: (anchorWidth: number, availableHeight: number) => boolean;
  readonly setWidth: (availableWidth: number) => boolean;
}

const opposite: Readonly<Record<PhysicalSide, PhysicalSide>> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

function vertical(side: PhysicalSide): boolean {
  return side === 'top' || side === 'bottom';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

function edges({ x, y, width, height }: Rect): Edges {
  return { top: y, right: x + width, bottom: y + height, left: x };
}

function visibleEdges(reference: Rect, intersection: IntersectionObserverEntry | undefined): Edges {
  if (!intersection) {
    return edges(reference);
  }
  const { intersectionRect, boundingClientRect } = intersection;
  // Normalize the clipping sample to Floating UI's fixed coordinate space.
  return edges({
    x: reference.x + intersectionRect.x - boundingClientRect.x,
    y: reference.y + intersectionRect.y - boundingClientRect.y,
    width: intersectionRect.width,
    height: intersectionRect.height,
  });
}

function sideRoom(bounds: Edges, target: Edges, gap: number): Edges {
  return {
    top: target.top - bounds.top - gap,
    right: bounds.right - target.right - gap,
    bottom: bounds.bottom - target.bottom - gap,
    left: target.left - bounds.left - gap,
  };
}

function chooseSide(
  requested: PhysicalSide,
  room: Edges,
  width: number,
  height: number,
): PhysicalSide {
  const other = opposite[requested];
  if (vertical(requested)) {
    return room[requested] < height && room[other] > room[requested] ? other : requested;
  }
  if (room[requested] >= width) {
    return requested;
  }
  if (room[other] >= width) {
    return other;
  }
  return room.top > room.bottom ? 'top' : 'bottom';
}

function nearestEdge(
  first: PhysicalSide,
  second: PhysicalSide,
  requested: PhysicalSide,
  source: Edges,
  avoid: Edges,
): PhysicalSide {
  const a = Math.abs(source[first] - avoid[first]);
  const b = Math.abs(source[second] - avoid[second]);
  return a === b ? (requested === second ? second : first) : a < b ? first : second;
}

function chooseOutside(
  requested: PhysicalSide,
  rtl: boolean,
  source: Edges,
  avoid: Edges,
  bounds: Edges,
  gap: number,
  width: number,
  height: number,
): PhysicalSide | undefined {
  const room = sideRoom(bounds, avoid, gap);
  const inline = nearestEdge(
    rtl ? 'right' : 'left',
    rtl ? 'left' : 'right',
    requested,
    source,
    avoid,
  );
  const block = nearestEdge('top', 'bottom', requested, source, avoid);
  return [inline, opposite[inline], block, opposite[block]].find(
    (side) => room[side] >= (vertical(side) ? height : width),
  );
}

function cssPixels(value: string | undefined): number {
  return Number.parseFloat(value ?? '') || 0;
}

function getAvoidEdges(anchor: HTMLElement, avoid: HTMLElement, reference: Rect): Edges | null {
  if (!isConnectedNode(avoid) || ownerDocumentOf(avoid) !== ownerDocumentOf(anchor)) {
    return null;
  }
  const box = avoid.getBoundingClientRect();
  if (!box.width || !box.height) {
    return null;
  }
  // Express the avoid box in the same fixed coordinate space as Floating UI's
  // reference. This retains the platform's zoom and scrollbar adjustments.
  const source = anchor.getBoundingClientRect();
  return edges({
    x: box.left + reference.x - source.left,
    y: box.top + reference.y - source.top,
    width: box.width,
    height: box.height,
  });
}

/** Select the main axis and its readable height before the usual offset/shift. */
export function previewMiddleware({
  anchor,
  floating,
  avoid,
  placement: requestedPlacement,
  rtl,
  gap,
  padding,
  valid,
  intersection,
  onUnavailable,
  setSize,
  setWidth,
}: PreviewLayout): Middleware[] {
  const [requestedSide, alignment] = requestedPlacement.split('-') as [
    PhysicalSide,
    'start' | 'end' | undefined,
  ];
  const computed = getComputedStyleSafe(floating);
  const inset = (side: PhysicalSide): number =>
    Math.max(padding, cssPixels(computed?.getPropertyValue(`--_overlay-safe-${side}`)));
  const safePadding = {
    top: inset('top'),
    right: inset('right'),
    bottom: inset('bottom'),
    left: inset('left'),
  };
  const reading = floating.querySelector<HTMLElement>('[data-unica-preview-scroll]');
  let offsetDistance = gap;
  let viewport: Rect | undefined;

  return [
    {
      name: 'previewFit',
      async fn({ placement, rects }) {
        viewport ??= await platform.getClippingRect({
          element: floating,
          boundary: [],
          rootBoundary: 'viewport',
          strategy: 'fixed',
        });
        const view = edges(viewport);
        if (!valid()) {
          return {};
        }
        const source = edges(rects.reference);
        const visible = visibleEdges(rects.reference, intersection);
        if (
          visible.bottom <= view.top ||
          visible.top >= view.bottom ||
          visible.right <= view.left ||
          visible.left >= view.right
        ) {
          onUnavailable();
          return {};
        }
        const bounds = {
          top: view.top + safePadding.top,
          right: view.right - safePadding.right,
          bottom: view.bottom - safePadding.bottom,
          left: view.left + safePadding.left,
        };
        const availableWidth = bounds.right - bounds.left;
        if (availableWidth <= 0) {
          onUnavailable();
          return {};
        }
        if (setWidth(availableWidth)) {
          return { reset: { rects: true } };
        }
        // Read intrinsic height without removing the last cap. Temporarily removing
        // it would reset native scrollTop when all the content happened to fit.
        const width = rects.floating.width;
        const overflow = reading ? Math.max(0, reading.scrollHeight - reading.clientHeight) : 0;
        const height = rects.floating.height + overflow;
        const avoidEdges = avoid ? getAvoidEdges(anchor, avoid, rects.reference) : null;
        const outside = avoidEdges
          ? chooseOutside(requestedSide, rtl, source, avoidEdges, bounds, gap, width, height)
          : undefined;
        // Keep the source's full size and cross-axis alignment, but position
        // off its reachable edge so the pointer corridor spans the actual gap.
        const target = outside && avoidEdges ? avoidEdges : visible;
        const room = sideRoom(bounds, target, gap);
        const nextSide = outside ?? chooseSide(requestedSide, room, width, height);
        const availableHeight = vertical(nextSide) ? room[nextSide] : bounds.bottom - bounds.top;
        if (availableHeight <= 0) {
          onUnavailable();
          return {};
        }
        const sizeChanged = setSize(rects.reference.width, availableHeight);
        const towardEnd = nextSide === 'bottom' || nextSide === 'right';
        offsetDistance = gap + (target[nextSide] - source[nextSide]) * (towardEnd ? 1 : -1);
        const nextPlacement: Placement = alignment ? `${nextSide}-${alignment}` : nextSide;
        if (placement !== nextPlacement || sizeChanged) {
          return { reset: { placement: nextPlacement, rects: sizeChanged } };
        }
        return {};
      },
    },
    offset(() => offsetDistance),
    shift({ boundary: [], padding: safePadding }),
  ];
}

export const previewBridgeProperties: readonly string[] = [
  '--_overlay-bridge-content',
  '--_overlay-bridge-inset',
  '--_overlay-bridge-clip',
];

function bridgeRange(
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number,
): [number, number] {
  if (start < otherEnd && end > otherStart) {
    // Allow a diagonal approach after collision shift while keeping the hit
    // region local to the source's projection rather than the whole panel edge.
    return [Math.max(start, otherStart - 4), Math.min(end, otherEnd + 4)];
  }
  return start >= otherEnd ? [start, Math.min(end, start + 8)] : [Math.max(start, end - 8), end];
}

export function updatePreviewBridge(
  style: CSSStyleDeclaration,
  floating: HTMLElement,
  anchorBox: Edges,
  side: PhysicalSide,
  gap: number,
): void {
  const panel = floating.getBoundingClientRect();
  const sourceEdge = anchorBox[side];
  const panelEdge = panel[opposite[side]];
  const depth = Math.abs(panelEdge - sourceEdge);
  const fore = side === 'bottom' || side === 'right';
  if (
    depth === 0 ||
    depth > gap + 1 ||
    (fore ? panelEdge <= sourceEdge : sourceEdge <= panelEdge)
  ) {
    style.removeProperty('--_overlay-bridge-content');
    return;
  }

  const isVertical = vertical(side);
  const crossStart = isVertical ? 'left' : 'top';
  const crossEnd = isVertical ? 'right' : 'bottom';
  const sourceStart = anchorBox[crossStart];
  const sourceEnd = anchorBox[crossEnd];
  const panelStart = panel[crossStart];
  const panelEnd = panel[crossEnd];
  const [a, b] = bridgeRange(sourceStart, sourceEnd, panelStart, panelEnd);
  const [c, d] = bridgeRange(panelStart, panelEnd, sourceStart, sourceEnd);
  const mainStart = Math.min(sourceEdge, panelEdge);
  const mainEnd = Math.max(sourceEdge, panelEdge);
  const min = Math.min(a, c);
  const max = Math.max(b, d);
  if (max <= min) {
    style.removeProperty('--_overlay-bridge-content');
    return;
  }

  const top = isVertical ? mainStart : min;
  const right = isVertical ? max : mainEnd;
  const bottom = isVertical ? mainEnd : max;
  const left = isVertical ? min : mainStart;
  const computed = getComputedStyleSafe(floating);
  const inset = [
    top - panel.top - cssPixels(computed?.borderTopWidth),
    panel.right - right - cssPixels(computed?.borderRightWidth),
    panel.bottom - bottom - cssPixels(computed?.borderBottomWidth),
    left - panel.left - cssPixels(computed?.borderLeftWidth),
  ];
  const point = (main: number, cross: number): string => {
    const along = fore === (main === sourceEdge) ? 0 : 100;
    const across = ((clamp(cross, min, max) - min) / (max - min)) * 100;
    return isVertical ? `${across}% ${along}%` : `${along}% ${across}%`;
  };
  const clip = [
    point(sourceEdge, a),
    point(sourceEdge, b),
    point(panelEdge, d),
    point(panelEdge, c),
  ];
  style.setProperty('--_overlay-bridge-inset', inset.map((value) => `${value}px`).join(' '));
  style.setProperty('--_overlay-bridge-clip', `polygon(${clip.join(', ')})`);
  style.setProperty('--_overlay-bridge-content', '""');
}

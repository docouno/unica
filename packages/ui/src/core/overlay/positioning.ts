import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/dom';
import type {
  Middleware,
  Padding,
  Placement,
  Side as PhysicalSide,
  SideObject,
  VirtualElement,
} from '@floating-ui/dom';
import { getComputedStyleSafe, isRTL, reportErrorSafe } from '../dom.js';
import { createFrameJob } from '../frame-scheduler.js';
import {
  composedAncestors,
  elementStyle,
  getAttr,
  isConnectedNode,
  liveViewOf,
  matchesSelector,
  ownerDocumentOf,
  removeAttr,
  setAttr,
} from './dom.js';
import {
  previewBridgeProperties,
  previewMiddleware,
  updatePreviewBridge,
} from './position-preview.js';

export type Side = 'top' | 'bottom' | 'start' | 'end';
export type Align = 'start' | 'center' | 'end';

export interface AnchoredOverlay<T extends Element = HTMLElement> {
  readonly anchor: T;
  readonly reference?: VirtualElement | undefined;
  readonly floating: HTMLElement;
  readonly side: Side;
  readonly align: Align;
  readonly gap: number;
  readonly padding?: number | undefined;
  readonly popover?:
    | {
        readonly measureBlockSize: (floating: HTMLElement) => number;
        readonly preserveSide?: boolean | undefined;
        readonly fixedSide?: boolean | undefined;
        readonly point?: boolean | undefined;
        readonly lockSide?: (() => boolean) | undefined;
        readonly isAnchorAvailable: (anchor: T) => boolean;
        readonly isFloatingAvailable?: ((floating: HTMLElement) => boolean) | undefined;
        readonly onUnavailable: () => void;
        readonly onPositioned: () => void;
      }
    | undefined;
  readonly preview?:
    | {
        readonly avoid?: HTMLElement | null | undefined;
        readonly isAvailable: () => boolean;
        readonly onUnavailable: () => void;
        readonly onPositioned?: (() => void) | undefined;
      }
    | undefined;
}

interface PositionBinding {
  readonly document: Document;
  readonly canRetainGeometry: () => boolean;
  readonly restoreGeometry: () => void;
  readonly cleanup: (retainGeometry?: boolean) => void;
}

const updates = new WeakMap<HTMLElement, PositionBinding>();
const safeAreaProperty = '--_overlay-safe-area';
const safeAreaInsets =
  'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)';
const oppositeSide = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const;

function intersectsViewport(rect: DOMRectReadOnly, view: Window): boolean {
  const viewport = view.visualViewport;
  const left = viewport?.offsetLeft ?? 0;
  const top = viewport?.offsetTop ?? 0;
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > left &&
    rect.bottom > top &&
    rect.left < left + (viewport?.width ?? view.innerWidth) &&
    rect.top < top + (viewport?.height ?? view.innerHeight)
  );
}

export interface AnchorVisibility<T extends Element = HTMLElement> {
  readonly observe: (anchor: T) => void;
  readonly unobserve: (anchor: T) => void;
  readonly dispose: () => void;
}

export function anchorIntersectsViewport(anchor: Element): boolean {
  const view = liveViewOf(anchor.ownerDocument);
  return view !== null && intersectsViewport(anchor.getBoundingClientRect(), view);
}

/** Catch scroll and paint clips before admission and keep the same sample for focus return. */
export function watchVisibleAnchors<T extends Element>(
  document: Document,
  candidates: readonly T[],
  onSample: (visible: ReadonlySet<T>) => void,
): AnchorVisibility<T> {
  const view = liveViewOf(document);
  const observed = new Set<T>();
  const pending = new Set<T>();
  const visible = new Set<T>();
  let active = true;
  const notify = (): void => {
    if (active && pending.size === 0) {
      onSample(visible);
    }
  };
  const observer =
    view && typeof view.IntersectionObserver === 'function'
      ? new view.IntersectionObserver(
          (entries) => {
            for (const { target, intersectionRect } of entries) {
              const anchor = target as T;
              if (!observed.has(anchor)) {
                continue;
              }
              pending.delete(anchor);
              if (intersectsViewport(intersectionRect, view)) {
                visible.add(anchor);
              } else {
                visible.delete(anchor);
              }
            }
            notify();
          },
          // Engines can round Number.MIN_VALUE to zero and miss edge-touching targets.
          { threshold: [0, 1e-9] },
        )
      : undefined;

  const observe = (anchor: T): void => {
    if (observed.has(anchor) || anchor.ownerDocument !== document) {
      return;
    }
    observed.add(anchor);
    if (observer) {
      pending.add(anchor);
      observer.observe(anchor);
    } else if (anchorIntersectsViewport(anchor)) {
      visible.add(anchor);
    }
  };
  for (const anchor of candidates) {
    observe(anchor);
  }
  queueMicrotask(notify);

  return {
    observe,
    unobserve(anchor) {
      observer?.unobserve(anchor);
      observed.delete(anchor);
      visible.delete(anchor);
      if (pending.delete(anchor)) {
        queueMicrotask(notify);
      }
    },
    dispose() {
      active = false;
      observer?.disconnect();
    },
  };
}

function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) {
    removeAttr(element, name);
  } else {
    setAttr(element, name, value);
  }
}

function logicalSide(physical: string, rtl: boolean): Side {
  if (physical === 'left') {
    return rtl ? 'end' : 'start';
  }
  if (physical === 'right') {
    return rtl ? 'start' : 'end';
  }
  return physical === 'top' ? 'top' : 'bottom';
}

function viewportPadding(floating: HTMLElement, padding: number): Padding {
  const insets = getComputedStyleSafe(floating)?.getPropertyValue(safeAreaProperty).trim() ?? '';
  const [top = 0, right = 0, bottom = 0, left = 0] = insets
    .split(/\s+/)
    .map((value) => Math.max(0, Number.parseFloat(value) || 0));
  return {
    top: padding + top,
    right: padding + right,
    bottom: padding + bottom,
    left: padding + left,
  };
}

/** Safe horizontal limits in the same coordinates as getBoundingClientRect(). */
export function overlayInlineBounds(
  floating: HTMLElement,
  padding: number,
): { left: number; right: number } {
  const view = floating.ownerDocument.defaultView;
  const viewport = view?.visualViewport;
  const inset = viewportPadding(floating, padding) as SideObject;
  const left = viewport?.offsetLeft ?? 0;
  return {
    left: left + inset.left,
    right: left + (viewport?.width ?? view?.innerWidth ?? 0) - inset.right,
  };
}

function preferredSide(
  requested: PhysicalSide,
  room: SideObject,
  width: number,
  height: number,
): PhysicalSide {
  const opposite = oppositeSide[requested];
  if (requested === 'top' || requested === 'bottom') {
    return room[requested] < height && room[opposite] > room[requested] ? opposite : requested;
  }
  if (room[requested] >= width) {
    return requested;
  }
  if (room[opposite] >= width) {
    return opposite;
  }
  return room.bottom < height && room.top > room.bottom ? 'top' : 'bottom';
}

interface PopoverLayout {
  readonly floating: HTMLElement;
  readonly placement: Placement;
  readonly gap: number;
  readonly padding: number;
  readonly valid: () => boolean;
  readonly previousSide: Side | undefined;
  readonly fixedSide: boolean;
  readonly lockSide: (() => boolean) | undefined;
  readonly point: boolean;
  readonly rtl: boolean;
  readonly virtualReference: boolean;
  readonly measureBlockSize: (floating: HTMLElement) => number;
  readonly setSize: (anchorWidth: number, availableHeight: number) => boolean;
  readonly setWidth: (availableWidth: number) => boolean;
}

function popoverMiddleware({
  floating,
  placement: requestedPlacement,
  gap,
  padding,
  valid,
  previousSide,
  fixedSide,
  lockSide,
  point,
  rtl,
  virtualReference,
  measureBlockSize,
  setSize,
  setWidth,
}: PopoverLayout): Middleware[] {
  const [requested, alignment] = requestedPlacement.split('-') as [
    PhysicalSide,
    'start' | 'end' | undefined,
  ];
  const clippingPadding = viewportPadding(floating, padding);
  const fitMainAxis = shift({ padding: clippingPadding, mainAxis: false, crossAxis: true });
  return [
    ...(virtualReference ? [] : [hide({ strategy: 'referenceHidden' })]),
    offset(point ? { mainAxis: gap, alignmentAxis: gap } : gap),
    {
      name: 'viewportSide',
      async fn(state) {
        const overflow = await state.platform.detectOverflow(state, {
          elementContext: 'reference',
          // Measure room against the top layer viewport. The reference's own
          // scrollport is checked by the visibility middleware.
          altBoundary: true,
          padding: clippingPadding,
        });
        if (!valid() || state.middlewareData.hide?.referenceHidden) {
          return {};
        }
        const { reference, floating: floatingRect } = state.rects;
        // Apply the viewport width before deciding which side fits.
        const availableWidth = Math.max(0, reference.width - overflow.left - overflow.right);
        if (setWidth(availableWidth)) {
          const dimensions = await state.platform.getDimensions(state.elements.floating);
          if (!valid()) {
            return {};
          }
          if (
            dimensions.width !== floatingRect.width ||
            dimensions.height !== floatingRect.height
          ) {
            return { reset: { rects: true } };
          }
        }
        const room = {
          top: -overflow.top - gap,
          right: -overflow.right - gap,
          bottom: -overflow.bottom - gap,
          left: -overflow.left - gap,
        };
        const height = measureBlockSize(floating);
        const keepSide = previousSide === 'top' || previousSide === 'bottom';
        // Filtering can shrink an upward-opening panel without moving its anchor.
        // Move the panel if the current side can no longer expose a usable slice.
        const side = fixedSide
          ? requested
          : keepSide &&
              (lockSide?.() ||
                room[previousSide] >= Math.min(height, 96) ||
                room[oppositeSide[previousSide]] <= room[previousSide])
            ? previousSide
            : preferredSide(requested, room, floatingRect.width, height);
        let resolvedAlignment = alignment;
        if (point && alignment) {
          const startRoom = rtl ? room.left : room.right;
          const endRoom = rtl ? room.right : room.left;
          if (
            alignment === 'start' &&
            startRoom < floatingRect.width &&
            endRoom >= floatingRect.width
          ) {
            resolvedAlignment = 'end';
          } else if (
            alignment === 'end' &&
            endRoom < floatingRect.width &&
            startRoom >= floatingRect.width
          ) {
            resolvedAlignment = 'start';
          }
        }
        const next: Placement = resolvedAlignment ? `${side}-${resolvedAlignment}` : side;
        return state.placement === next ? {} : { reset: { placement: next } };
      },
    },
    shift({ padding: clippingPadding }),
    size({
      padding: clippingPadding,
      apply({ availableHeight, rects, middlewareData }) {
        if (valid() && !middlewareData.hide?.referenceHidden) {
          setSize(rects.reference.width, Math.max(0, availableHeight));
        }
      },
    }),
    // Keep the gap unless a cut-off anchor puts it beyond the padded viewport.
    ...(fixedSide ? [] : [{ ...fitMainAxis, name: 'fitMainAxis' }]),
  ];
}

function visualViewportMargin(document: Document, viewport: VisualViewport | null): string {
  if (!viewport) {
    return '0px';
  }
  const root = document.documentElement;
  const { offsetTop, offsetLeft, width, height } = viewport;
  // IntersectionObserver roots use the layout viewport during pinch zoom. Keep
  // the native ancestor clip calculation but shrink its root to the visual viewport.
  return [
    -offsetTop,
    offsetLeft + width - root.clientWidth,
    offsetTop + height - root.clientHeight,
    -offsetLeft,
  ]
    .map((margin) => `${Math.ceil(margin)}px`)
    .join(' ');
}

function initializeGeometry(
  floating: HTMLElement,
  style: CSSStyleDeclaration,
  preview: boolean,
  safeArea: boolean,
): () => void {
  const margin = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
  const inset = ['top', 'right', 'bottom', 'left'];
  const properties = [
    'position',
    ...(style.getPropertyValue('margin') ? ['margin'] : margin),
    ...(style.getPropertyValue('inset') ? ['inset'] : inset),
    '--anchor-width',
    '--overlay-available-height',
    '--overlay-available-width',
    ...(preview ? previewBridgeProperties : []),
    ...(safeArea ? [safeAreaProperty] : []),
  ];
  const original = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));
  const previousSurface = getAttr(floating, 'data-surface');
  const previousSide = getAttr(floating, 'data-side');
  const previousAlign = getAttr(floating, 'data-align');
  setAttr(floating, 'data-surface', 'overlay');
  style.position = 'fixed';
  style.margin = '0';
  style.inset = '0 auto auto 0';
  if (safeArea) {
    style.setProperty(safeAreaProperty, safeAreaInsets);
  }

  return () => {
    style.removeProperty('inset');
    style.removeProperty('margin');
    for (const { property, value, priority } of original) {
      style.setProperty(property, value, priority);
    }
    restoreAttribute(floating, 'data-surface', previousSurface);
    restoreAttribute(floating, 'data-side', previousSide);
    restoreAttribute(floating, 'data-align', previousAlign);
  };
}

/** Bind an already open, in-place popover to its anchor. */
export function positionOverlay<T extends Element>({
  anchor,
  reference,
  floating,
  side,
  align,
  gap,
  padding = 0,
  popover,
  preview,
}: AnchoredOverlay<T>): () => void {
  const previous = updates.get(floating);
  const document = ownerDocumentOf(anchor);
  const view = liveViewOf(document);
  const style = elementStyle(floating);
  if (!document || ownerDocumentOf(floating) !== document || !view || !style) {
    previous?.cleanup();
    return () => {};
  }
  const reading = preview
    ? floating.querySelector<HTMLElement>('[data-unica-preview-scroll]')
    : null;
  // Refitting an open carrier can change its width and height caps.
  let scrollOffset =
    previous && reading ? { top: reading.scrollTop, left: reading.scrollLeft } : undefined;
  // Transfer the original style snapshot while leaving the last position in
  // place until the new anchor or placement is measured.
  const retained =
    preview &&
    previous?.document === document &&
    previous.canRetainGeometry() &&
    matchesSelector(floating, ':popover-open')
      ? previous.restoreGeometry
      : undefined;
  previous?.cleanup(retained !== undefined);
  const restoreGeometry =
    retained ?? initializeGeometry(floating, style, preview !== undefined, popover !== undefined);

  let active = true;
  let revision = 0;
  let lastRTL: boolean | undefined;
  let lastX: number | undefined;
  let lastY: number | undefined;
  let lastAnchorWidth: number | undefined;
  let lastAvailableHeight: number | undefined;
  let lastAvailableWidth: number | undefined;
  let lastResolvedSide: Side | undefined;
  let lastResolvedAlign: Align | undefined;
  let intersection: IntersectionObserverEntry | undefined;
  let unavailable = false;
  let positioned = false;

  const isOpen = (): boolean =>
    active &&
    liveViewOf(document) === view &&
    isConnectedNode(floating) &&
    ownerDocumentOf(floating) === document &&
    matchesSelector(floating, ':popover-open');
  const anchorIsConnected = (): boolean =>
    isConnectedNode(anchor) && ownerDocumentOf(anchor) === document;
  const anchorIsVisible = (computed: CSSStyleDeclaration | null): boolean =>
    computed !== null &&
    computed.visibility !== 'hidden' &&
    computed.visibility !== 'collapse' &&
    view.Element.prototype.getClientRects.call(anchor).length > 0;
  const isLive = (): boolean => isOpen() && anchorIsConnected();

  const offsetMiddleware = offset(gap);
  const flipMiddleware = flip({ padding });
  const shiftMiddleware = shift({ padding });

  const setWidth = (width: number): boolean => {
    if (width !== lastAvailableWidth) {
      lastAvailableWidth = width;
      style.setProperty('--overlay-available-width', `${width}px`);
      return true;
    }
    return false;
  };
  const setSize = (anchorWidth: number, availableHeight: number): boolean => {
    const anchorChanged = anchorWidth !== lastAnchorWidth;
    if (anchorChanged) {
      lastAnchorWidth = anchorWidth;
      style.setProperty('--anchor-width', `${anchorWidth}px`);
    }
    if (availableHeight !== lastAvailableHeight) {
      lastAvailableHeight = availableHeight;
      style.setProperty('--overlay-available-height', `${availableHeight}px`);
      return true;
    }
    return anchorChanged;
  };
  const onUnavailable = popover?.onUnavailable ?? preview?.onUnavailable;
  const reportUnavailable = (): void => {
    if (active && onUnavailable && !unavailable) {
      unavailable = true;
      // An initial update can run before the caller receives its cleanup function.
      view.queueMicrotask(() => {
        if (active && (!popover || isOpen())) {
          onUnavailable();
        }
      });
    }
  };

  const update = (): void => {
    const current = ++revision;
    const valid = (): boolean => current === revision && !unavailable && isLive();
    if (!valid()) {
      if (!anchorIsConnected()) {
        reportUnavailable();
      }
      return;
    }
    if (preview) {
      const clipped =
        intersection &&
        (!intersection.intersectionRect.width || !intersection.intersectionRect.height);
      if (clipped || !preview.isAvailable()) {
        reportUnavailable();
        return;
      }
      // The browser's clipping algorithm follows containing blocks, transforms,
      // clip-paths and top-layer escapes. Wait for its first measurement.
      if (typeof view.IntersectionObserver === 'function' && !intersection) {
        return;
      }
    }
    const computed = getComputedStyleSafe(anchor);
    if (
      popover &&
      (!anchorIsVisible(computed) ||
        !popover.isAnchorAvailable(anchor) ||
        popover.isFloatingAvailable?.(floating) === false)
    ) {
      reportUnavailable();
      return;
    }
    const rtl = isRTL(anchor, computed);
    lastRTL = rtl;
    const physical =
      side === 'start'
        ? rtl
          ? 'right'
          : 'left'
        : side === 'end'
          ? rtl
            ? 'left'
            : 'right'
          : side;
    const placement: Placement = align === 'center' ? physical : `${physical}-${align}`;

    void computePosition(reference ?? anchor, floating, {
      placement,
      strategy: 'fixed',
      // A local direction override on the floating surface must not flip the anchor's alignment.
      platform: { ...platform, isRTL: () => rtl },
      middleware: preview
        ? previewMiddleware({
            anchor,
            floating,
            avoid: preview.avoid,
            placement,
            rtl,
            gap,
            padding,
            valid,
            intersection,
            onUnavailable: reportUnavailable,
            setSize,
            setWidth,
          })
        : popover
          ? popoverMiddleware({
              floating,
              placement,
              gap,
              padding,
              valid,
              previousSide: popover.preserveSide ? lastResolvedSide : undefined,
              fixedSide: popover.fixedSide ?? false,
              lockSide: popover.lockSide,
              point: popover.point ?? false,
              rtl,
              virtualReference: reference !== undefined,
              measureBlockSize: popover.measureBlockSize,
              setSize,
              setWidth,
            })
          : [
              offsetMiddleware,
              flipMiddleware,
              shiftMiddleware,
              size({
                padding,
                apply({ availableWidth, availableHeight, rects }) {
                  if (valid()) {
                    setSize(rects.reference.width, Math.max(0, availableHeight));
                    setWidth(Math.max(0, availableWidth));
                  }
                },
              }),
            ],
    }).then(
      ({ x, y, placement: resolved, middlewareData }) => {
        if (!valid()) {
          return;
        }
        if (middlewareData.hide?.referenceHidden) {
          reportUnavailable();
          return;
        }
        if (x !== lastX) {
          lastX = x;
          style.left = `${x}px`;
        }
        if (y !== lastY) {
          lastY = y;
          style.top = `${y}px`;
        }
        const [rawSide = 'bottom', rawAlign] = resolved.split('-');
        const nextSide = logicalSide(rawSide, rtl);
        const nextAlign: Align = rawAlign === 'start' || rawAlign === 'end' ? rawAlign : 'center';
        if (nextSide !== lastResolvedSide) {
          lastResolvedSide = nextSide;
          setAttr(floating, 'data-side', nextSide);
        }
        if (nextAlign !== lastResolvedAlign) {
          lastResolvedAlign = nextAlign;
          setAttr(floating, 'data-align', nextAlign);
        }
        if (scrollOffset && reading) {
          reading.scrollTop = scrollOffset.top;
          reading.scrollLeft = scrollOffset.left;
          scrollOffset = undefined;
        }
        if (preview?.avoid) {
          for (const property of previewBridgeProperties) {
            style.removeProperty(property);
          }
        } else if (preview) {
          const box = anchor.getBoundingClientRect();
          const observedBox = intersection?.boundingClientRect;
          const clipped = intersection?.intersectionRect;
          const knownIntersection =
            observedBox &&
            clipped &&
            observedBox.x === box.x &&
            observedBox.y === box.y &&
            observedBox.width === box.width &&
            observedBox.height === box.height;
          const source = knownIntersection ? clipped : box;
          const physicalSide = rawSide as 'top' | 'right' | 'bottom' | 'left';
          updatePreviewBridge(style, floating, source, physicalSide, gap);
        }
        if (preview && !positioned) {
          positioned = true;
          preview.onPositioned?.();
        }
        popover?.onPositioned();
      },
      (error: unknown) => {
        if (valid()) {
          reportErrorSafe(view, error);
        }
      },
    );
  };

  let intersectionObserver: IntersectionObserver | undefined;
  let rootMargin: string | undefined;
  const refresh = (): void => {
    if (!preview || typeof view.IntersectionObserver !== 'function' || !isLive()) {
      update();
      return;
    }
    intersection = undefined;
    revision++;
    const margin = visualViewportMargin(document, view.visualViewport);
    if (!intersectionObserver || margin !== rootMargin) {
      intersectionObserver?.disconnect();
      rootMargin = margin;
      intersectionObserver = new view.IntersectionObserver(
        (entries, observer) => {
          const latest = entries.at(-1);
          if (observer === intersectionObserver && latest) {
            intersection = latest;
            update();
          }
        },
        { root: document, rootMargin: margin, threshold: [0, Number.EPSILON, 1] },
      );
    } else {
      // Clipped rectangles with the same area can move without a threshold
      // transition. Request a fresh sample when an observed layout input changes.
      intersectionObserver.takeRecords();
      intersectionObserver.unobserve(anchor);
    }
    intersectionObserver.observe(anchor);
  };
  let stop = autoUpdate(anchor, floating, refresh);
  const mutations = new view.MutationObserver(() => {
    if (preview || (isLive() && (popover || isRTL(anchor) !== lastRTL))) {
      refresh();
    }
  });
  let ancestry: Element[] = [];
  const observeAncestry = (next: Element[]): void => {
    ancestry = next;
    const attributeFilter = ['dir'];
    if (preview || popover) {
      attributeFilter.push('class', 'hidden', 'style');
    }
    if (preview) {
      attributeFilter.push('open', 'popover');
    }
    if (popover) {
      attributeFilter.push('aria-disabled', 'disabled', 'inert');
    }
    for (const ancestor of ancestry) {
      mutations.observe(ancestor, { attributes: true, attributeFilter });
    }
  };
  observeAncestry(Array.from(composedAncestors(anchor)));
  const stopAutoUpdate = (): void => {
    try {
      stop();
    } catch {
      // Ignore cross-origin frame teardown.
    }
  };
  const visibilityJob = popover
    ? createFrameJob(document, {
        measure() {
          if (unavailable || !isOpen()) {
            return;
          }
          const computed = getComputedStyleSafe(anchor);
          if (
            !anchorIsConnected() ||
            !anchorIsVisible(computed) ||
            popover.isFloatingAvailable?.(floating) === false
          ) {
            return reportUnavailable;
          }
          const next = Array.from(composedAncestors(anchor));
          if (computed?.getPropertyValue('interactivity')) {
            for (const ancestor of next) {
              const ancestorStyle = ancestor === anchor ? computed : getComputedStyleSafe(ancestor);
              if (ancestorStyle?.getPropertyValue('interactivity') === 'inert') {
                return reportUnavailable;
              }
              if (matchesSelector(ancestor, 'dialog:modal')) {
                break;
              }
            }
          }
          visibilityJob?.schedule();
          if (
            next.length !== ancestry.length ||
            next.some((ancestor, index) => ancestor !== ancestry[index])
          ) {
            return () => {
              mutations.disconnect();
              observeAncestry(next);
              stopAutoUpdate();
              stop = autoUpdate(anchor, floating, refresh);
            };
          }
          if (isRTL(anchor, computed) !== lastRTL) {
            return refresh;
          }
        },
      })
    : undefined;
  if (reading) {
    mutations.observe(reading, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    floating.addEventListener('load', refresh, true);
    document.fonts?.addEventListener('loadingdone', refresh);
  }
  const avoid = preview?.avoid;
  const stopAvoid =
    avoid &&
    !Object.is(avoid, anchor) &&
    ownerDocumentOf(avoid) === document &&
    isConnectedNode(avoid)
      ? autoUpdate(avoid, null, refresh)
      : undefined;
  const cleanup = (retainGeometry = false): void => {
    if (!active) {
      return;
    }
    active = false;
    stopAutoUpdate();
    for (const dispose of [stopAvoid]) {
      try {
        dispose?.();
      } catch {
        // Ignore cross-origin frame teardown.
      }
    }
    intersectionObserver?.disconnect();
    intersectionObserver = undefined;
    mutations.disconnect();
    visibilityJob?.dispose();
    if (reading) {
      floating.removeEventListener('load', refresh, true);
      document.fonts?.removeEventListener('loadingdone', refresh);
    }
    updates.delete(floating);
    if (!retainGeometry) {
      restoreGeometry();
    }
  };
  updates.set(floating, {
    document,
    canRetainGeometry: () => preview !== undefined && (positioned || retained !== undefined),
    restoreGeometry,
    cleanup,
  });
  visibilityJob?.schedule();
  return () => cleanup();
}

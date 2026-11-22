import { autoUpdate, computePosition, flip, offset, platform, shift, size } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/dom';
import { isRTL as isElementRTL, reportErrorSafe } from '../dom.js';
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

export interface AnchoredOverlay {
  readonly anchor: HTMLElement;
  readonly floating: HTMLElement;
  readonly side: Side;
  readonly align: Align;
  readonly gap: number;
  readonly padding?: number | undefined;
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
export function positionOverlay({
  anchor,
  floating,
  side,
  align,
  gap,
  padding = 0,
  preview,
}: AnchoredOverlay): () => void {
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
  const restoreGeometry = retained ?? initializeGeometry(floating, style, preview !== undefined);

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

  const isRTL = (): boolean => isElementRTL(anchor);
  const isLive = (): boolean =>
    active &&
    liveViewOf(document) === view &&
    isConnectedNode(anchor) &&
    isConnectedNode(floating) &&
    ownerDocumentOf(anchor) === document &&
    ownerDocumentOf(floating) === document &&
    matchesSelector(floating, ':popover-open');

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
  const reportUnavailable = (): void => {
    if (active && preview && !unavailable) {
      unavailable = true;
      // An initial update can run before the caller receives its cleanup function.
      view.queueMicrotask(() => {
        if (active) {
          preview.onUnavailable();
        }
      });
    }
  };

  const update = (): void => {
    const current = ++revision;
    const valid = (): boolean => current === revision && !unavailable && isLive();
    if (!valid()) {
      if (!isConnectedNode(anchor) || ownerDocumentOf(anchor) !== document) {
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
    const rtl = isRTL();
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

    void computePosition(anchor, floating, {
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
      ({ x, y, placement: resolved }) => {
        if (!valid()) {
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
  const stop = autoUpdate(anchor, floating, refresh);
  const mutations = new view.MutationObserver(() => {
    if (preview || (isLive() && isRTL() !== lastRTL)) {
      refresh();
    }
  });
  for (const ancestor of composedAncestors(anchor)) {
    mutations.observe(ancestor, {
      attributes: true,
      attributeFilter: preview ? ['class', 'dir', 'hidden', 'open', 'popover', 'style'] : ['dir'],
    });
  }
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
    avoid && avoid !== anchor && ownerDocumentOf(avoid) === document && isConnectedNode(avoid)
      ? autoUpdate(avoid, null, refresh)
      : undefined;
  const cleanup = (retainGeometry = false): void => {
    if (!active) {
      return;
    }
    active = false;
    for (const dispose of [stop, stopAvoid]) {
      try {
        dispose?.();
      } catch {
        // Ignore cross-origin frame teardown.
      }
    }
    intersectionObserver?.disconnect();
    intersectionObserver = undefined;
    mutations.disconnect();
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
  return () => cleanup();
}

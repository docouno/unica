import { autoUpdate, computePosition, flip, offset, platform, shift, size } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/dom';
import {
  addListenerSafe,
  isRTL as isElementRTL,
  removeListenerSafe,
  reportErrorSafe,
} from '../dom.js';
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

export type Side = 'top' | 'bottom' | 'start' | 'end';
export type Align = 'start' | 'center' | 'end';

export interface AnchoredOverlay {
  readonly anchor: HTMLElement;
  readonly floating: HTMLElement;
  readonly side: Side;
  readonly align: Align;
  readonly gap: number;
  readonly padding?: number | undefined;
}

const updates = new WeakMap<HTMLElement, () => void>();

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

/** Bind an already open, in-place popover to its anchor. */
export function positionOverlay({
  anchor,
  floating,
  side,
  align,
  gap,
  padding = 0,
}: AnchoredOverlay): () => void {
  updates.get(floating)?.();
  const document = ownerDocumentOf(anchor);
  if (!document || ownerDocumentOf(floating) !== document) {
    return () => {};
  }
  const view = liveViewOf(document);
  if (!view) {
    return () => {};
  }

  const style = elementStyle(floating);
  if (!style) {
    return () => {};
  }
  const margin = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
  const inset = ['top', 'right', 'bottom', 'left'];
  const properties = [
    'position',
    ...(style.getPropertyValue('margin') ? ['margin'] : margin),
    ...(style.getPropertyValue('inset') ? ['inset'] : inset),
    '--anchor-width',
    '--overlay-available-height',
    '--overlay-available-width',
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

  const update = (): void => {
    const current = ++revision;
    const valid = (): boolean => current === revision && isLive();
    if (!valid()) {
      return;
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
      middleware: [
        offsetMiddleware,
        flipMiddleware,
        shiftMiddleware,
        size({
          padding,
          apply({ availableWidth, availableHeight, rects }) {
            if (!valid()) {
              return;
            }
            const nextWidth = rects.reference.width;
            const nextAvailHeight = Math.max(0, availableHeight);
            const nextAvailWidth = Math.max(0, availableWidth);
            if (nextWidth !== lastAnchorWidth) {
              lastAnchorWidth = nextWidth;
              style.setProperty('--anchor-width', `${nextWidth}px`);
            }
            if (nextAvailHeight !== lastAvailableHeight) {
              lastAvailableHeight = nextAvailHeight;
              style.setProperty('--overlay-available-height', `${nextAvailHeight}px`);
            }
            if (nextAvailWidth !== lastAvailableWidth) {
              lastAvailableWidth = nextAvailWidth;
              style.setProperty('--overlay-available-width', `${nextAvailWidth}px`);
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
      },
      (error: unknown) => {
        if (valid()) {
          reportErrorSafe(view, error);
        }
      },
    );
  };

  const stop = autoUpdate(anchor, floating, update);
  const direction = new view.MutationObserver(() => {
    if (isLive() && isRTL() !== lastRTL) {
      update();
    }
  });
  for (const ancestor of composedAncestors(anchor)) {
    direction.observe(ancestor, { attributes: true, attributeFilter: ['dir'] });
  }
  const onFontsDone = (): void => {
    if (isLive()) {
      update();
    }
  };
  const fonts = document.fonts;
  if (fonts) {
    addListenerSafe(fonts, 'loadingdone', onFontsDone);
  }

  const cleanup = (): void => {
    if (!active) {
      return;
    }
    active = false;
    try {
      stop();
    } catch {
      // Ignore cross-origin frame teardown.
    }
    direction.disconnect();
    if (fonts) {
      removeListenerSafe(fonts, 'loadingdone', onFontsDone);
    }
    updates.delete(floating);
    style.removeProperty('inset');
    style.removeProperty('margin');
    for (const { property, value, priority } of original) {
      style.setProperty(property, value, priority);
    }
    restoreAttribute(floating, 'data-surface', previousSurface);
    restoreAttribute(floating, 'data-side', previousSide);
    restoreAttribute(floating, 'data-align', previousAlign);
  };
  updates.set(floating, cleanup);
  return cleanup;
}

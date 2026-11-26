import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  getComputedStyleSafe,
  getDefaultView,
  getDocumentFonts,
  matchesSafe,
} from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { breakpointValue, breakpoints } from '../Layout/responsive.js';
import type { LayoutStyle, Responsive } from '../Layout/responsive.js';
import type { TabItem } from './collection.js';
import type { TabsDistribution, TabsOrientation } from './types.js';

const distributions = {
  content: {
    columns: 'max-content',
    width: 'max-content',
    padding: 'var(--_tabs-padding)',
    triggerMax: 'var(--_tabs-content-max)',
  },
  equal: {
    columns: 'minmax(var(--_tabs-equal-min), 1fr)',
    width: 'min-content',
    padding: 'var(--_tabs-equal-padding)',
    triggerMax: 'none',
  },
} as const;

export function distributionStyle(
  distribution: Responsive<TabsDistribution> | undefined,
): LayoutStyle {
  let current: TabsDistribution = 'content';
  const style: LayoutStyle = {};
  for (const breakpoint of breakpoints) {
    current = breakpointValue(distribution, breakpoint) ?? current;
    const { columns, width, padding, triggerMax } = distributions[current];
    style[`--_tabs-${breakpoint}-columns` as const] = columns;
    style[`--_tabs-${breakpoint}-width` as const] = width;
    style[`--_tabs-${breakpoint}-padding` as const] = padding;
    style[`--_tabs-${breakpoint}-trigger-max` as const] = triggerMax;
  }
  return style;
}

const scrollTolerance = 1;
const revealClearance = 5;
const browseContext = 24;
const overflowAttribute = 'data-unica-tabs-overflow';
const countClippedAttribute = 'data-unica-tabs-count-clipped';
const countSelector = '.unica-tabs-count';
const labelSelector = '.unica-tabs-label';
const emptyItems: readonly TabItem[] = [];
const initialLayout: Layout = { start: false, end: false, rtl: false, hints: new Set() };

interface Layout {
  readonly start: boolean;
  readonly end: boolean;
  readonly rtl: boolean;
  readonly hints: ReadonlySet<string>;
}

interface Viewport {
  readonly left: number;
  readonly right: number;
  readonly scale: number;
  readonly start: boolean;
  readonly end: boolean;
  readonly rtl: boolean;
  readonly inset: number;
}

function viewportGeometry(list: HTMLDivElement, horizontal: boolean, keyboardWidth = 0): Viewport {
  const bounds = list.getBoundingClientRect();
  // Client rects include CSS zoom. Native scroll offsets and scroll padding use local CSS pixels.
  const scale = bounds.width > 0 && list.offsetWidth > 0 ? bounds.width / list.offsetWidth : 1;
  const css = getComputedStyleSafe(list);
  const rtl = css?.direction === 'rtl';
  const range = horizontal ? list.scrollWidth - list.clientWidth : 0;
  const offset = rtl ? -list.scrollLeft : list.scrollLeft;
  // A fractional final step can round to the closest physical pixel.
  const tolerance = Math.max(scrollTolerance, 1 / scale);
  const canScrollBack = range > tolerance && offset > tolerance;
  const canScrollForward = range > tolerance && range - offset > tolerance;
  const inset = Number.parseFloat(css?.scrollPaddingInlineStart ?? '') || revealClearance;
  const mask = (inset - revealClearance) * scale;
  const width = list.clientWidth * scale;
  const maskedWidth = width - (Number(canScrollBack) + Number(canScrollForward)) * mask;
  // Equal cells retain their minimum width. The focus ring gets the full
  // scroll viewport when the keyboard target cannot fit between the chevrons.
  const needsFullViewport =
    keyboardWidth > 0 && keyboardWidth + 2 * revealClearance * scale > maskedWidth;
  const start = canScrollBack && !needsFullViewport;
  const end = canScrollForward && !needsFullViewport;
  const left = bounds.left + list.clientLeft * scale;
  return {
    scale,
    start,
    end,
    rtl,
    inset,
    left: left + ((rtl ? end : start) ? mask : 0),
    right: left + width - ((rtl ? start : end) ? mask : 0),
  };
}

function revealTab(list: HTMLDivElement, tab: HTMLButtonElement): void {
  if (!list.clientWidth || list.scrollWidth - list.clientWidth <= scrollTolerance) {
    return;
  }
  const target = tab.getBoundingClientRect();
  const keyboardWidth = matchesSafe(tab, ':focus-visible') ? target.width : 0;
  const { left, right, scale, rtl } = viewportGeometry(list, true, keyboardWidth);
  const clearance = revealClearance * scale;
  const start = left + clearance;
  const end = right - clearance;
  const delta =
    target.width > end - start
      ? rtl
        ? target.right - end
        : target.left - start
      : target.left < start
        ? target.left - start
        : Math.max(0, target.right - end);
  // An instant scroll with zero delta also interrupts an in-flight chevron step.
  list.scrollTo({ left: list.scrollLeft + delta / scale, behavior: 'instant' });
}

function updateOverflow(list: HTMLDivElement): void {
  const position = list.scrollLeft;
  list.removeAttribute(overflowAttribute);
  const overflows = list.scrollWidth - list.clientWidth > scrollTolerance;
  list.toggleAttribute(overflowAttribute, overflows);
  if (overflows && position !== list.scrollLeft) {
    list.scrollLeft = position;
  }
}

function measureItems(
  list: HTMLDivElement,
  items: readonly TabItem[],
  horizontal: boolean,
  keyboardWidth: number,
): Layout {
  const { left, right, scale, start, end, rtl } = viewportGeometry(list, horizontal, keyboardWidth);
  const hints = new Set<string>();
  const tolerance = 0.5 * scale;

  for (const { node, key, navigable } of items) {
    const count = node.querySelector(countSelector);
    if (count) {
      const bounds = count.getBoundingClientRect();
      count.toggleAttribute(
        countClippedAttribute,
        horizontal && (bounds.left < left - tolerance || bounds.right > right + tolerance),
      );
    }
    if (!navigable || !list.clientWidth) {
      continue;
    }
    const anchor = node.getBoundingClientRect();
    if (!anchor.width || (horizontal && (anchor.right <= left || anchor.left >= right))) {
      continue;
    }
    const label = node.querySelector<HTMLElement>(labelSelector);
    if (!label || label.scrollWidth > label.clientWidth) {
      hints.add(key);
    }
  }
  return { start, end, rtl, hints };
}

interface TabsLayout extends Layout {
  readonly sync: () => void;
  readonly update: () => void;
  readonly reveal: (node: HTMLButtonElement) => void;
  readonly markBrowsing: () => void;
  readonly browse: (edge: 'start' | 'end') => void;
}

export function useTabsLayout(
  listRef: RefObject<HTMLDivElement | null>,
  committedItems: readonly TabItem[] | null,
  selected: string | null,
  orientation: TabsOrientation,
  distribution: Responsive<TabsDistribution> | undefined,
): TabsLayout {
  const items = committedItems ?? emptyItems;
  const horizontal = orientation === 'horizontal';
  const browsing = useRef(false);
  const [layout, setLayout] = useState(initialLayout);

  const update = useCallback((): void => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const keyboardTarget = browsing.current
      ? undefined
      : items.find(({ node }) => matchesSafe(node, ':focus-visible'))?.node;
    const next = measureItems(
      list,
      items,
      horizontal,
      keyboardTarget?.getBoundingClientRect().width ?? 0,
    );
    setLayout((current) =>
      current.start === next.start &&
      current.end === next.end &&
      current.rtl === next.rtl &&
      current.hints.size === next.hints.size &&
      [...next.hints].every((key) => current.hints.has(key))
        ? current
        : next,
    );
  }, [horizontal, items, listRef]);

  const sync = useCallback((): void => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    if (horizontal && list.clientWidth) {
      updateOverflow(list);
      const focused = items.find(({ node }) => matchesSafe(node, ':focus-visible'));
      if (focused) {
        browsing.current = false;
      }
      const target =
        focused ?? (browsing.current ? undefined : items.find(({ key }) => selected === key));
      if (target) {
        revealTab(list, target.node);
      }
    } else {
      list.removeAttribute(overflowAttribute);
    }
    update();
  }, [horizontal, items, listRef, selected, update]);

  useIsoLayoutEffect(() => {
    browsing.current = false;
  }, [orientation, selected]);

  useIsoLayoutEffect(() => {
    sync();
  }, [distribution, sync]);

  useIsoLayoutEffect(() => {
    const list = listRef.current;
    const view = list && getDefaultView(list.ownerDocument);
    if (!list || !view) {
      return;
    }
    const resize = view.ResizeObserver && new view.ResizeObserver(sync);
    resize?.observe(list);
    if (list.firstElementChild) {
      resize?.observe(list.firstElementChild);
    }
    for (const { node } of items) {
      resize?.observe(node);
      for (const slot of node.querySelectorAll(`${countSelector}, ${labelSelector}`)) {
        resize?.observe(slot);
      }
    }
    const fonts = getDocumentFonts(list.ownerDocument);
    fonts?.addEventListener('loadingdone', sync);
    const contrast = view.matchMedia?.('(prefers-contrast: more), (forced-colors: active)');
    const pointer = view.matchMedia?.('(pointer: coarse)');
    contrast?.addEventListener('change', sync);
    pointer?.addEventListener('change', sync);

    return () => {
      resize?.disconnect();
      fonts?.removeEventListener('loadingdone', sync);
      contrast?.removeEventListener('change', sync);
      pointer?.removeEventListener('change', sync);
    };
  }, [items, listRef, sync]);

  const markBrowsing = useCallback((): void => {
    browsing.current = true;
  }, []);

  const reveal = useCallback(
    (node: HTMLButtonElement): void => {
      const list = listRef.current;
      if (horizontal && list?.contains(node)) {
        browsing.current = false;
        revealTab(list, node);
        update();
      }
    },
    [horizontal, listRef, update],
  );

  function browse(edge: 'start' | 'end'): void {
    const list = listRef.current;
    const view = list && getDefaultView(list.ownerDocument);
    if (!list || !view) {
      return;
    }
    const { rtl, inset } = viewportGeometry(list, true);
    const direction = (edge === 'end') !== rtl ? 1 : -1;
    const distance = Math.max(browseContext, list.clientWidth - 2 * inset - browseContext);
    markBrowsing();
    list.scrollBy({
      left: direction * distance,
      behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    update();
  }

  return { ...layout, sync, update, reveal, markBrowsing, browse };
}

import type { RefObject } from 'react';
import { getDefaultView, getRootActiveElement, getRootNodeSafe } from '../../core/dom.js';
import { createFrameJob } from '../../core/frame-scheduler.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

const itemSelector = '.unica-segmented-control-item';

export function revealSegment(rail: HTMLDivElement, item: HTMLElement): void {
  const view = getDefaultView(rail.ownerDocument);
  const styles = view?.getComputedStyle(rail);
  if (!styles || !rail.clientWidth) {
    return;
  }
  const { left, right } = rail.getBoundingClientRect();
  const cell = item.getBoundingClientRect();
  const scrollLeft = left + Number.parseFloat(styles.paddingLeft);
  const scrollRight = right - Number.parseFloat(styles.paddingRight);
  const canFit = cell.width <= scrollRight - scrollLeft;
  let delta = 0;
  if (canFit) {
    if (cell.left < scrollLeft) {
      delta = cell.left - scrollLeft;
    } else if (cell.right > scrollRight) {
      delta = cell.right - scrollRight;
    }
  } else if (styles.direction === 'rtl') {
    if (cell.right > scrollRight || cell.right < scrollLeft) {
      delta = cell.right - scrollRight;
    }
  } else if (cell.left < scrollLeft || cell.left > scrollRight) {
    delta = cell.left - scrollLeft;
  }
  if (Math.abs(delta) > 0.01) {
    rail.scrollBy({ left: delta, behavior: 'instant' });
  }
}

function revealCurrentSegment(rail: HTMLDivElement): void {
  const active = getRootActiveElement(getRootNodeSafe(rail), rail.ownerDocument);
  const focused = rail.contains(active) ? active?.closest<HTMLElement>(itemSelector) : null;
  const chosen = rail
    .querySelector('input[data-unica-segmented-option]:checked')
    ?.closest<HTMLElement>(itemSelector);
  const item = focused ?? chosen;
  if (item) {
    revealSegment(rail, item);
  }
}

export function useSegmentedLayout(
  railRef: RefObject<HTMLDivElement | null>,
  itemStructure: string,
  selected: string | null,
  focused: string | null,
  dir: string | undefined,
): void {
  useIsoLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    const view = getDefaultView(rail.ownerDocument);
    const items = Array.from(rail.querySelectorAll<HTMLElement>(itemSelector));
    const measure = (): (() => void) | undefined => {
      const styles = view?.getComputedStyle(rail);
      if (!rail.clientWidth || !styles) {
        return;
      }
      let left = Infinity;
      let right = -Infinity;
      for (const item of items) {
        const bounds = item.getBoundingClientRect();
        left = Math.min(left, bounds.left);
        right = Math.max(right, bounds.right);
      }
      const inlineInset = Number.parseFloat(styles.paddingInlineStart);
      // Widths from getBoundingClientRect preserve the fractional overflow that
      // the browser can round away in scrollWidth and clientWidth.
      const overflow = right - left + 2 * inlineInset > rail.getBoundingClientRect().width + 0.01;
      return () => {
        rail.toggleAttribute('data-unica-segmented-overflow', overflow);
        revealCurrentSegment(rail);
      };
    };
    measure()?.();
    if (view?.ResizeObserver) {
      // The overflow guard changes padding on the observed rail.
      const frame = createFrameJob(rail.ownerDocument, { measure });
      const observer = new view.ResizeObserver(frame.schedule);
      observer.observe(rail);
      for (const item of items) {
        observer.observe(item);
      }
      return () => {
        observer.disconnect();
        frame.dispose();
      };
    }
  }, [railRef, itemStructure]);

  useIsoLayoutEffect(() => {
    const rail = railRef.current;
    if (rail) {
      revealCurrentSegment(rail);
    }
  }, [railRef, selected, focused, dir]);
}

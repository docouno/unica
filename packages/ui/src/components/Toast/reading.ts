import { getRootNodeSafe } from '../../core/dom.js';
import { getToastActiveElement } from './host.js';
import type { ToastId } from './types.js';

export const rowSelector = '[data-unica-toast-item]';

interface ReadingAnchor {
  readonly id: string;
  readonly offset: number;
}

export interface ReadingPosition {
  pinned: boolean;
  anchor: ReadingAnchor | undefined;
  max: number;
}

const listPadding = (list: HTMLElement): CSSStyleDeclaration | undefined =>
  list.ownerDocument.defaultView?.getComputedStyle(list);

function slotOffset(row: HTMLElement, list: HTMLElement): number {
  return (
    (row.previousElementSibling ?? row).getBoundingClientRect().top -
    list.getBoundingClientRect().top
  );
}

function rowsOf(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>(rowSelector));
}

function saveAnchor(list: HTMLElement, position: ReadingPosition): void {
  const rows = rowsOf(list);
  const edge = Number.parseFloat(listPadding(list)?.paddingBlockStart ?? '0');
  const row = rows.find((item) => slotOffset(item, list) + item.offsetHeight > edge) ?? rows.at(-1);
  const id = row?.dataset.unicaToastItem;
  position.anchor = row && id ? { id, offset: slotOffset(row, list) } : undefined;
}

export function rememberReadingPosition(
  list: HTMLElement,
  top: boolean,
  position: ReadingPosition,
): void {
  const max = list.scrollHeight - list.clientHeight;
  const previousEnd =
    position.pinned && max !== position.max && Math.abs(position.max - list.scrollTop) <= 1;
  position.pinned = top ? list.scrollTop <= 1 : max - list.scrollTop <= 1 || previousEnd;
  saveAnchor(list, position);
}

function synchronizeCovers(list: HTMLElement): void {
  const view = list.ownerDocument.defaultView;
  if (!view?.CSSUnitValue || !list.hasAttribute('data-unica-toast-edge-motion')) {
    return;
  }
  for (const animation of list.getAnimations({ subtree: true })) {
    const timeline = animation.timeline;
    if (
      !(animation instanceof view.CSSAnimation) ||
      !(animation.effect instanceof view.KeyframeEffect) ||
      !timeline ||
      !('startOffset' in timeline) ||
      !('endOffset' in timeline) ||
      !(timeline.startOffset instanceof view.CSSUnitValue) ||
      !(timeline.endOffset instanceof view.CSSUnitValue)
    ) {
      continue;
    }
    const row = animation.effect.target?.closest<HTMLElement>(rowSelector);
    const length = timeline.endOffset.value - timeline.startOffset.value;
    if (!row || length <= 0) {
      continue;
    }
    // Chromium can retain an offset from the former neighbor after inserting or removing a row.
    let offset: number;
    switch (animation.animationName) {
      case 'unica-toast-cover-start':
        offset = length - 1 - Number.parseFloat(row.style.getPropertyValue('--_toast-row-height'));
        break;
      case 'unica-toast-cover-end':
        offset = 1;
        break;
      case 'unica-toast-cover-complete':
        offset = length - 2;
        break;
      case 'unica-toast-uncover-complete':
        offset = 0;
        break;
      default:
        continue;
    }
    const start = (100 * offset) / length;
    if (
      !(animation.startTime instanceof view.CSSUnitValue) ||
      Math.abs(animation.startTime.value - start) > 0.0001
    ) {
      animation.startTime = new view.CSSUnitValue(start, 'percent');
    }
  }
}

export function layoutReading(
  list: HTMLDivElement,
  root: HTMLDivElement,
  top: boolean,
  position: ReadingPosition,
): void {
  const gutter = `${list.offsetWidth - list.clientWidth}px`;
  if (root.style.getPropertyValue('--_toast-scrollbar-gutter') !== gutter) {
    root.style.setProperty('--_toast-scrollbar-gutter', gutter);
  }
  const padding = listPadding(list);
  const readable =
    list.clientHeight -
    Number.parseFloat(padding?.paddingBlockStart ?? '0') -
    Number.parseFloat(padding?.paddingBlockEnd ?? '0');
  const rows = rowsOf(list);
  for (const row of rows) {
    const height = row.getBoundingClientRect().height;
    row.toggleAttribute('data-unica-toast-oversized', height > readable);
    const value = `${height}px`;
    if (row.style.getPropertyValue('--_toast-row-height') !== value) {
      row.style.setProperty('--_toast-row-height', value);
    }
  }
  const max = list.scrollHeight - list.clientHeight;
  list.toggleAttribute('data-unica-toast-edge-motion', max > 1 && readable >= 72);
  const focused = getToastActiveElement(list);
  if (position.pinned && !(focused && focused !== list && list.contains(focused))) {
    list.scrollTop = top ? 0 : max;
  } else if (position.anchor) {
    const anchor = position.anchor;
    const row = rows.find((item) => item.dataset.unicaToastItem === anchor.id);
    if (row) {
      list.scrollTop += slotOffset(row, list) - anchor.offset;
    }
  }
  if (max <= 1) {
    position.pinned = true;
  }
  position.max = max;
  saveAnchor(list, position);
  synchronizeCovers(list);
}

export function revealReadingControl(list: HTMLElement, control: HTMLElement): void {
  const row = control.closest<HTMLElement>(rowSelector);
  const bounds = list.getBoundingClientRect();
  const padding = listPadding(list);
  if (row && row.previousElementSibling) {
    const start = slotOffset(row, list) + list.scrollTop;
    const end = start + row.getBoundingClientRect().height;
    const min = Math.ceil(
      end - list.clientHeight + Number.parseFloat(padding?.paddingBlockEnd ?? '0'),
    );
    const max = Math.floor(start - Number.parseFloat(padding?.paddingBlockStart ?? '0'));
    if (min <= max) {
      const inset = max - min >= 2 ? 1 : 0;
      list.scrollTop = Math.min(max - inset, Math.max(list.scrollTop, min + inset));
      return;
    }
  }
  const target = control.getBoundingClientRect();
  const inset = Math.min(16, Math.max(1, (list.clientHeight - target.height) / 2));
  if (target.top < bounds.top + inset) {
    list.scrollTop += target.top - bounds.top - inset;
  } else if (target.bottom > bounds.top + list.clientHeight - inset) {
    list.scrollTop += target.bottom - bounds.top - list.clientHeight + inset;
  }
}

function hitTestFor(element: Element): Document | ShadowRoot {
  const root = getRootNodeSafe(element) as Document | ShadowRoot;
  return typeof root.elementFromPoint === 'function' ? root : element.ownerDocument;
}

export function toastHitTarget(element: Element, x: number, y: number): Element | null {
  return hitTestFor(element).elementFromPoint(x, y);
}

export function isVisibleReadingControl(control: Element): boolean {
  const bounds = control.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) {
    return false;
  }
  return control.contains(
    hitTestFor(control).elementFromPoint(
      (bounds.left + bounds.right) / 2,
      (bounds.top + bounds.bottom) / 2,
    ),
  );
}

function readableText(row: HTMLElement, scrollport: HTMLElement): boolean {
  const copy = row.querySelector('.unica-toast-copy');
  if (!copy) {
    return false;
  }
  const document = row.ownerDocument;
  const hitTest = hitTestFor(row);
  const bounds = scrollport.getBoundingClientRect();
  const left = bounds.left + scrollport.clientLeft;
  const top = bounds.top + scrollport.clientTop;
  const right = left + scrollport.clientWidth;
  const bottom = top + scrollport.clientHeight;
  const walker = document.createTreeWalker(copy, 4);
  const range = document.createRange();
  let foundText = false;
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    if (!text.textContent?.trim()) {
      continue;
    }
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) {
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }
      foundText = true;
      if (
        rect.left < left - 1 ||
        rect.right > right + 1 ||
        rect.top < top - 1 ||
        rect.bottom > bottom + 1
      ) {
        return false;
      }
      // Hit-test the actual glyph lines through sticky covers and clipping. Card padding
      // and decoration may be off the scrollport while all of the message is readable.
      const dx = Math.min(1, rect.width / 2);
      const dy = Math.min(1, rect.height / 2);
      for (const x of [rect.left + dx, (rect.left + rect.right) / 2, rect.right - dx]) {
        for (const y of [rect.top + dy, (rect.top + rect.bottom) / 2, rect.bottom - dy]) {
          if (!row.contains(hitTest.elementFromPoint(x, y))) {
            return false;
          }
        }
      }
    }
  }
  return foundText;
}

export function readableToastIds(root: HTMLElement, scrollport: HTMLElement): Set<ToastId> {
  const readable = new Set<ToastId>();
  for (const row of rowsOf(root)) {
    const id = row.dataset.unicaToastItem as ToastId | undefined;
    if (id && readableText(row, scrollport)) {
      readable.add(id);
    }
  }
  return readable;
}

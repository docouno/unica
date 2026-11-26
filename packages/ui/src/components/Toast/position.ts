import { isContentEditableSafe } from '../../core/dom.js';
import { getToastActiveElement } from './host.js';
import type { ToastPlacement } from './types.js';

export type Edge = 'top' | 'bottom';

const inset = 24;
const editable =
  'textarea, input:not([type]), input:is([type="text"], [type="search"], [type="email"], [type="password"], [type="url"], [type="tel"], [type="number"])';

export function positionCarrier(
  node: HTMLDivElement,
  scope: HTMLElement,
  placement: ToastPlacement,
): Edge {
  const document = node.ownerDocument;
  const view = document.defaultView;
  const visual = view?.visualViewport;
  const layoutWidth = document.documentElement.clientWidth;
  const layoutHeight = document.documentElement.clientHeight;
  let left = visual?.offsetLeft ?? 0;
  let top = visual?.offsetTop ?? 0;
  let right = left + (visual?.width ?? layoutWidth);
  let bottom = top + (visual?.height ?? layoutHeight);
  if (scope !== document.body && scope.localName !== 'dialog') {
    const rect = scope.getBoundingClientRect();
    // A dedicated portal node may have no flow box. Only laid-out scopes constrain the viewport.
    if (rect.width > 0 && rect.height > 0) {
      left = Math.max(left, rect.left);
      top = Math.max(top, rect.top);
      right = Math.min(right, rect.right);
      bottom = Math.min(bottom, rect.bottom);
    }
  }
  const preferred = placement.startsWith('top') ? 'top' : 'bottom';
  let edge: Edge = preferred;
  const active = getToastActiveElement(node);
  if (
    active &&
    !node.contains(active) &&
    (active.matches(editable) || isContentEditableSafe(active))
  ) {
    const field = active.getBoundingClientRect();
    const width = Math.min(384, right - left - inset * 2);
    const rtl = view?.getComputedStyle(node).direction === 'rtl';
    const alignment = placement.split('-')[1];
    const x =
      alignment === 'center'
        ? (left + right - width) / 2
        : (alignment === 'start') !== rtl
          ? left + inset
          : right - width - inset;
    if (field.left < x + width && field.right > x && field.top < bottom && field.bottom > top) {
      const above = Math.max(0, field.top - top - inset);
      const below = Math.max(0, bottom - field.bottom - inset);
      const current = preferred === 'top' ? above : below;
      const alternative = preferred === 'top' ? below : above;
      const cards = node.querySelector<HTMLElement>('.unica-toast-list, .unica-toast-stack');
      const dock = node.querySelector<HTMLElement>('.unica-toast-dock');
      const desired = Math.min(450, cards?.scrollHeight ?? 0) + (dock ? dock.offsetHeight + 14 : 0);
      if (current < desired && alternative > current) {
        edge = preferred === 'top' ? 'bottom' : 'top';
      }
      if (edge === 'top') {
        bottom = Math.max(top, Math.min(bottom, field.top));
      } else {
        top = Math.min(bottom, Math.max(top, field.bottom));
      }
    }
  }
  const offsets = { left, right: layoutWidth - right, top, bottom: layoutHeight - bottom };
  for (const [side, offset] of Object.entries(offsets)) {
    const key = `--_toast-viewport-${side}`;
    const value = `${Math.max(0, offset)}px`;
    if (node.style.getPropertyValue(key) !== value) {
      node.style.setProperty(key, value);
    }
  }
  return edge;
}

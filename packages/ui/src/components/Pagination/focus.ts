import { useCallback, useRef } from 'react';
import type { RefCallback, RefObject } from 'react';
import {
  getComputedStyleSafe,
  getDeepActiveElement,
  getDefaultView,
  getRootNodeSafe,
  isElementNode,
} from '../../core/dom.js';
import { isLiveFocusElement, observeFocusTransfer } from '../../core/focus-transfer.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

const itemAttribute = 'data-unica-pagination-target';
const targetSelector = 'button, a[href]';

interface FocusOrigin {
  readonly item: string;
  readonly node: Element;
  detaching: boolean;
}

function isAvailable(element: Element): boolean {
  const visibility = getComputedStyleSafe(element)?.visibility;
  return (
    isLiveFocusElement(element) &&
    element.getClientRects().length > 0 &&
    visibility !== 'hidden' &&
    visibility !== 'collapse'
  );
}

export function usePaginationFocus(visible: boolean): {
  track: RefObject<HTMLUListElement | null>;
  targetRef: RefCallback<HTMLElement>;
} {
  const track = useRef<HTMLUListElement>(null);
  const focused = useRef<FocusOrigin | null>(null);
  const reconcile = useRef<(() => void) | null>(null);
  const targetRef = useCallback<RefCallback<HTMLElement>>((node) => {
    if (node) {
      return () => {
        const origin = focused.current;
        if (origin?.node === node) {
          // React detaches the ref before removal can dispatch a native blur.
          origin.detaching = true;
          queueMicrotask(() => {
            if (focused.current === origin) {
              reconcile.current?.();
            }
          });
        }
      };
    }
  }, []);

  useIsoLayoutEffect(() => {
    const node = track.current;
    if (!visible || !node) {
      return;
    }

    const list = node;
    const doc = list.ownerDocument;
    const view = getDefaultView(doc);
    const tree = getRootNodeSafe(list);
    function remember(node: Element | null): void {
      const item = node?.closest(`[${itemAttribute}]`);
      const key = item?.getAttribute(itemAttribute);
      focused.current =
        node && key && item?.parentElement === list && node.matches(targetSelector)
          ? { item: key, node, detaching: false }
          : null;
    }

    function find(selector: string): HTMLElement | undefined {
      const node = list.querySelector<HTMLElement>(`:scope > ${selector} :is(${targetSelector})`);
      return node && isAvailable(node) ? node : undefined;
    }

    function recover(): void {
      const origin = focused.current;
      if (!origin || !list.isConnected) {
        return;
      }
      const active = getDeepActiveElement(doc, tree) ?? getDeepActiveElement(doc);
      if (active === origin.node && isAvailable(active)) {
        origin.detaching = false;
        return;
      }
      if (active && active !== origin.node && active !== doc.body) {
        remember(active);
        return;
      }
      if (isAvailable(origin.node) && list.contains(origin.node)) {
        // A live target that lost focus was explicitly left.
        focused.current = null;
        return;
      }

      const same = find(`[${itemAttribute}="${origin.item}"]`);
      const firstPage = list.querySelector(`:scope > [${itemAttribute}="1"]`);
      const numbered = firstPage && firstPage.getClientRects().length > 0;
      const destination =
        same ??
        (numbered ? find('.unica-pagination-number:has([aria-current="page"])') : undefined) ??
        find(`[${itemAttribute}="next"]`) ??
        find(`[${itemAttribute}="previous"]`);
      focused.current = null;
      destination?.focus({ preventScroll: true });
    }

    function onFocus(event: FocusEvent): void {
      remember(isElementNode(event.target) ? event.target : null);
    }

    function onDocumentFocus(event: FocusEvent): void {
      // Removing a focused node falls back to body without a focusin event.
      // An explicit focus transfer to body is a destination owned by the caller.
      if (event.target === doc.body) {
        focused.current = null;
      }
    }

    function onWindowBlur(event: FocusEvent): void {
      if (event.target === view) {
        focused.current = null;
      }
    }

    const stopTransfer = observeFocusTransfer(list, (target, transfer) => {
      const origin = focused.current;
      if (origin?.node === target) {
        if (transfer.destination || (!origin.detaching && isAvailable(target))) {
          focused.current = null;
        } else {
          queueMicrotask(() => {
            if (reconcile.current === recover && focused.current === origin) {
              recover();
            }
          });
        }
      }
      return false;
    });

    list.addEventListener('focusin', onFocus);
    doc.addEventListener('focusin', onDocumentFocus, true);
    view?.addEventListener('blur', onWindowBlur);
    remember(getDeepActiveElement(doc, tree));
    reconcile.current = recover;

    // The list can change size without a render. Observing the first number
    // separately also catches projections whose outer dimensions match.
    const resize = view?.ResizeObserver ? new view.ResizeObserver(recover) : undefined;
    resize?.observe(list);
    const firstPage = list.querySelector(`:scope > [${itemAttribute}="1"]`);
    if (firstPage) {
      resize?.observe(firstPage);
    }

    return () => {
      focused.current = null;
      reconcile.current = null;
      list.removeEventListener('focusin', onFocus);
      doc.removeEventListener('focusin', onDocumentFocus, true);
      view?.removeEventListener('blur', onWindowBlur);
      stopTransfer();
      resize?.disconnect();
    };
  }, [visible]);

  useIsoLayoutEffect(() => {
    reconcile.current?.();
  });

  return { track, targetRef };
}

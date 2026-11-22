import { useRef, useSyncExternalStore } from 'react';
import type { ReactElement, RefObject } from 'react';
import { composedAncestors, getComputedStyleSafe, getLiveView } from '../../core/dom.js';
import { hasHiddenAncestor } from '../../core/overlay/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

const registrationDelay = 100;
const deliveryDuration = 7000;
const subscribe = (): (() => void) => () => {};
const clientSnapshot = (): boolean => true;
const serverSnapshot = (): boolean => false;

const excluded =
  '.unica-alert, .unica-alert-actions, .unica-alert-close, .unica-visually-hidden, ' +
  'button, input, select, textarea, svg, script, style, template, [hidden], [inert], [aria-hidden="true" i]';

function messageIn(content: HTMLElement): string {
  const text: string[] = [];

  function collect(element: Element, block = false): void {
    if (element.matches(excluded)) {
      return;
    }
    const style = getComputedStyleSafe(element);
    if (
      style?.display === 'none' ||
      style?.visibility === 'hidden' ||
      style?.visibility === 'collapse' ||
      style?.contentVisibility === 'hidden'
    ) {
      return;
    }
    const separates =
      block ||
      (style?.display
        ? !style.display.startsWith('inline') && style.display !== 'contents'
        : /^(address|article|aside|blockquote|div|h[1-6]|li|p|pre|section|ul|ol)$/u.test(
            element.localName,
          ));
    if (separates || element.localName === 'br') {
      text.push(' ');
    }
    // A closed disclosure exposes only its first summary.
    const summary = element.matches('details:not([open])')
      ? [...element.children].find((child) => child.localName === 'summary')
      : undefined;
    if (summary) {
      collect(summary);
    } else if (!element.matches('details:not([open])')) {
      for (const child of element.childNodes) {
        if (child.nodeType === 3) {
          text.push(child.textContent ?? '');
        } else if (child.nodeType === 1) {
          collect(child as Element, element === content);
        }
      }
    }
    if (separates) {
      text.push(' ');
    }
  }

  collect(content);
  return text.join('').replace(/\s+/gu, ' ').trim();
}

interface AnnouncementProps {
  readonly role: 'alert' | 'status';
  readonly content: RefObject<HTMLDivElement | null>;
}

export function AlertAnnouncement({ role, content }: AnnouncementProps): ReactElement {
  const live = useRef<HTMLSpanElement>(null);
  const hydratedText = useRef<string | undefined>(undefined);
  const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  useIsoLayoutEffect(() => {
    const node = live.current;
    const column = content.current;
    const root = node?.parentElement;
    const view = root && getLiveView(root.ownerDocument);
    if (!node || !column || !root || !view) {
      return;
    }

    const ancestors = [...composedAncestors(root)];
    const isHidden = (): boolean => {
      // Native layers close before their CSS exit transition stops painting. The channel
      // also needs a layout box when its enclosing document hides it through CSS.
      if (
        hasHiddenAncestor(node, false) ||
        ancestors.some((element) => element.matches('[hidden], [inert], [aria-hidden="true" i]')) ||
        ['hidden', 'collapse'].includes(getComputedStyleSafe(node)?.visibility ?? '')
      ) {
        return true;
      }
      if (typeof node.checkVisibility === 'function') {
        return !node.checkVisibility();
      }
      return ancestors.some((element) => {
        const style = getComputedStyleSafe(element);
        return style?.display === 'none' || style?.contentVisibility === 'hidden';
      });
    };

    if (!isClient) {
      // Hydration reads the message already visible in the server markup as its baseline.
      hydratedText.current = isHidden() ? undefined : messageIn(column);
      return;
    }

    let previous = hydratedText.current;
    let registered = false;
    let visible = false;
    let registrationTimer: number | undefined;
    let deliveryTimer: number | undefined;

    const clearDelivery = (): void => {
      view.clearTimeout(deliveryTimer);
      if (node.textContent) {
        node.textContent = '';
      }
    };

    const reset = (): void => {
      view.clearTimeout(registrationTimer);
      clearDelivery();
      visible = false;
      registered = false;
      previous = undefined;
    };

    const reconcile = (): void => {
      if (!root.isConnected || isHidden()) {
        reset();
        return;
      }
      if (!visible) {
        visible = true;
        registrationTimer = view.setTimeout(() => {
          registered = true;
          reconcile();
        }, registrationDelay);
      }
      if (!registered) {
        return;
      }
      const message = messageIn(column);
      if (message === previous) {
        return;
      }
      previous = message;
      clearDelivery();
      if (message) {
        node.textContent = message;
        deliveryTimer = view.setTimeout(clearDelivery, deliveryDuration);
      }
    };

    const observer = new view.MutationObserver(reconcile);
    for (const element of ancestors) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['hidden', 'aria-hidden', 'inert', 'class', 'style', 'open', 'popover'],
      });
      // Popovers enter and leave the top layer without changing an open attribute.
      element.addEventListener('toggle', reconcile);
    }
    observer.observe(column, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['hidden', 'aria-hidden', 'inert', 'class', 'style', 'open'],
    });
    reconcile();

    return () => {
      observer.disconnect();
      for (const element of ancestors) {
        element.removeEventListener('toggle', reconcile);
      }
      reset();
    };
  }, [content, isClient]);

  return <span ref={live} className="unica-visually-hidden" role={role} aria-atomic="true" />;
}

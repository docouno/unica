import { useState } from 'react';
import type { RefObject } from 'react';
import {
  composedAncestors,
  composedContains,
  getDeepActiveElement,
  getLiveView,
  getRootNodeSafe,
  isElementNode,
  isInertElement,
  matchesSafe,
} from '../../core/dom.js';
import { resolveToastPortalHost, subscribeToModalChanges } from '../../core/overlay/runtime.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

function branches(host: HTMLElement): Set<Node> {
  const roots = new Set<Node>();
  for (const ancestor of composedAncestors(host)) {
    roots.add(ancestor.getRootNode());
  }
  roots.add(host.ownerDocument);
  return roots;
}

export function isToastHostAvailable(host: HTMLElement): boolean {
  const view = getLiveView(host.ownerDocument);
  if (
    !view ||
    !host.isConnected ||
    isInertElement(host) ||
    view.getComputedStyle(host).visibility !== 'visible'
  ) {
    return false;
  }
  for (const ancestor of composedAncestors(host)) {
    const style = view.getComputedStyle(ancestor);
    if (
      matchesSafe(
        ancestor,
        '[popover]:not(:popover-open), dialog:not([open]), [aria-hidden="true" i]',
      ) ||
      style.display === 'none' ||
      style.contentVisibility === 'hidden' ||
      style.opacity === '0'
    ) {
      return false;
    }
  }
  return true;
}

interface HostSelection {
  readonly container: HTMLElement;
  readonly host: HTMLElement | null;
  readonly generation: number;
}

/** Re-resolves on native modal transitions and on changes to the portal's physical branch. */
export function useToastHost(
  container: HTMLElement | null,
  carrierRef: RefObject<HTMLDivElement | null>,
  visibilityRef: RefObject<(() => void) | undefined>,
): HostSelection | null {
  const [selection, setSelection] = useState<HostSelection | null>(null);
  const ownerDocument = container?.ownerDocument;

  useIsoLayoutEffect(() => {
    if (!container || !ownerDocument) {
      setSelection(null);
      return;
    }
    const document = ownerDocument;
    const view = getLiveView(document);
    if (!view) {
      return;
    }
    let selected: HTMLElement | null = null;
    let observedRoots = new Set<Node>();
    let ancestors = new Set<Element>();
    let frame: number | undefined;
    function refreshAfterStyleChange(): void {
      if (frame === undefined) {
        frame = view!.requestAnimationFrame(() => {
          frame = undefined;
          refresh();
        });
      }
    }
    const affectsHost = (node: Node): boolean =>
      isElementNode(node) &&
      (composedContains(node, container) || composedContains(node, selected));
    const observer = new view.MutationObserver((records) => {
      // The carrier leaves the top layer if an ancestor is removed, even if React
      // observes only the final state after the same host is inserted again.
      const readmit = records.some(({ removedNodes }) => [...removedNodes].some(affectsHost));
      const carrier = carrierRef.current;
      if (
        readmit ||
        records.some(({ target, type, addedNodes }) => {
          if (type === 'attributes') {
            return (
              isElementNode(target) &&
              (ancestors.has(target) ||
                target === carrier ||
                (carrier !== null && target.parentElement === carrier) ||
                matchesSafe(target, 'dialog'))
            );
          }
          return (
            observedRoots.has(target) ||
            (isElementNode(target) && ancestors.has(target)) ||
            [...addedNodes].some(affectsHost) ||
            !container.isConnected ||
            (selected !== null && !selected.isConnected)
          );
        }) ||
        !observedRoots.has(container.getRootNode())
      ) {
        resolve(readmit);
      } else {
        // Selectors can reveal a scope or its live channel through a sibling's attributes
        // or content. Batch indirect changes by frame without polling a hidden host.
        refreshAfterStyleChange();
      }
    });
    const lifecycleEvents = ['toggle', 'close', 'slotchange'] as const;
    const styleEvents = [
      'focusin',
      'focusout',
      'pointerover',
      'pointerout',
      'input',
      'change',
    ] as const;
    const transitionEvents = ['transitionend', 'transitioncancel'] as const;

    function syncTransition(event: Event): void {
      const target = event.composedPath()[0];
      if (
        isElementNode(target) &&
        (ancestors.has(target) || composedContains(carrierRef.current ?? container!, target))
      ) {
        refresh();
      }
    }

    function stopWatching(root: Node): void {
      for (const event of lifecycleEvents) {
        root.removeEventListener(event, refresh, true);
      }
      for (const event of styleEvents) {
        root.removeEventListener(event, refreshAfterStyleChange, true);
      }
      for (const event of transitionEvents) {
        root.removeEventListener(event, syncTransition, true);
      }
    }

    function watch(next: HTMLElement | null): void {
      const roots = branches(container!);
      if (next) {
        for (const root of branches(next)) {
          roots.add(root);
        }
      }
      ancestors = new Set([...composedAncestors(container), ...composedAncestors(next)]);
      const rootSetChanged =
        roots.size !== observedRoots.size || [...roots].some((root) => !observedRoots.has(root));
      if (!rootSetChanged) {
        return;
      }
      observer.disconnect();
      for (const root of observedRoots) {
        if (!roots.has(root)) {
          stopWatching(root);
        }
      }
      for (const root of roots) {
        if (!observedRoots.has(root)) {
          for (const event of lifecycleEvents) {
            root.addEventListener(event, refresh, true);
          }
          // Focus, hover and form selectors can change visibility without a DOM mutation.
          for (const event of styleEvents) {
            root.addEventListener(event, refreshAfterStyleChange, true);
          }
          for (const event of transitionEvents) {
            root.addEventListener(event, syncTransition, true);
          }
        }
        observer.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
        });
      }
      observedRoots = roots;
    }

    function resolve(readmit: boolean): void {
      if (!container) {
        return;
      }
      const next = resolveToastPortalHost(container);
      const host = next && isToastHostAvailable(next) ? next : null;
      watch(next);
      selected = next;
      visibilityRef.current?.();
      setSelection((current) =>
        !readmit && current?.container === container && current.host === host
          ? current
          : { container, host, generation: (current?.generation ?? 0) + 1 },
      );
    }

    function refresh(): void {
      resolve(false);
    }

    const stopModal = subscribeToModalChanges(document, refresh);
    view.addEventListener('resize', refresh);
    refresh();
    return () => {
      stopModal();
      view.removeEventListener('resize', refresh);
      observer.disconnect();
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
      }
      for (const root of observedRoots) {
        stopWatching(root);
      }
    };
  }, [carrierRef, container, ownerDocument, visibilityRef]);

  return selection?.container === container ? selection : null;
}

export function hasToastVisibility(node: HTMLElement): boolean {
  const view = getLiveView(node.ownerDocument);
  if (!view || matchesSafe(node, '[aria-hidden="true" i], [inert]')) {
    return false;
  }
  const style = view.getComputedStyle(node);
  return (
    style.visibility === 'visible' &&
    style.display !== 'none' &&
    style.contentVisibility !== 'hidden' &&
    style.opacity !== '0' &&
    style.getPropertyValue('interactivity') !== 'inert'
  );
}

export function isOpenToastCarrier(node: HTMLElement, host: HTMLElement): boolean {
  return (
    node.parentNode === host &&
    matchesSafe(node, ':popover-open') &&
    isToastHostAvailable(host) &&
    hasToastVisibility(node) &&
    node.getClientRects().length > 0
  );
}

export function getToastActiveElement(scope: Element): Element | null {
  const document = scope.ownerDocument;
  return getDeepActiveElement(document, getRootNodeSafe(scope)) ?? getDeepActiveElement(document);
}

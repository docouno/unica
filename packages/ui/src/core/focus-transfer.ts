import {
  getComposedParentElement,
  getComputedStyleSafe,
  getDeepActiveElement,
  getDefaultView,
  getRootNodeSafe,
  getShadowRootSafe,
  isConnectedNode,
  isElementNode,
  isInertElement,
  matchesSafe,
} from './dom.js';

// Built-in HTML shadow host names in the DOM Standard. A custom element may
// also host a closed tree that cannot be observed from this observer.
const shadowHostNames = /* @__PURE__ */ new Set([
  'article',
  'aside',
  'blockquote',
  'body',
  'div',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'main',
  'nav',
  'p',
  'section',
  'span',
]);

export interface FocusTransfer {
  readonly event: FocusEvent;
  readonly destination: Element | null;
  readonly view: Window | null;
  pending: boolean;
  arrived: { readonly element: Element; readonly rendered: boolean } | null;
}

export function isExplicitBlurInProgress(transfer: FocusTransfer | null | undefined): boolean {
  return transfer?.destination === null && transfer.event.eventPhase !== 0;
}

export function isLiveFocusElement(element: Element): boolean {
  if (!isConnectedNode(element) || matchesSafe(element, ':disabled') || isInertElement(element)) {
    return false;
  }
  // A shadow host can have no box while its contents are live. Display none
  // on a composed ancestor, however, makes that entire subtree unavailable.
  for (
    let current: Element | null = element;
    current;
    current = getComposedParentElement(current)
  ) {
    const style = getComputedStyleSafe(current);
    if (
      style?.display === 'none' ||
      (current !== element && style?.getPropertyValue('content-visibility') === 'hidden')
    ) {
      return false;
    }
  }
  return true;
}

function isRendered(element: Element): boolean {
  const checkVisibility = (element as Partial<Element>).checkVisibility;
  if (checkVisibility) {
    return checkVisibility.call(element, { visibilityProperty: true });
  }
  const visibility = getComputedStyleSafe(element)?.visibility;
  return (
    visibility !== 'hidden' && visibility !== 'collapse' && element.getClientRects().length > 0
  );
}

function mayRetargetClosedFocus(element: Element): boolean {
  return (
    element.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
    (element.localName.includes('-') || shadowHostNames.has(element.localName)) &&
    !getShadowRootSafe(element) &&
    getDeepActiveElement(element.ownerDocument, getRootNodeSafe(element)) === element
  );
}

function unavailableRecipient(transfer: FocusTransfer): Element | null {
  const recipient = transfer.arrived;
  if (
    recipient &&
    (!isLiveFocusElement(recipient.element) ||
      (recipient.rendered && !isRendered(recipient.element)))
  ) {
    return recipient.element;
  }
  return null;
}

function hasLiveRecipient(transfer: FocusTransfer): boolean {
  return transfer.arrived !== null && unavailableRecipient(transfer) === null;
}

export function hasPendingFocusTransfer(transfer: FocusTransfer | null | undefined): boolean {
  return (
    transfer === null ||
    (transfer !== undefined &&
      (hasLiveRecipient(transfer) ||
        transfer.event.eventPhase !== 0 ||
        (transfer.destination !== null && transfer.pending)))
  );
}

function afterFocusDispatch(transfer: FocusTransfer, settle: () => void): void {
  queueMicrotask(() => {
    if (transfer.event.eventPhase === 0) {
      settle();
      return;
    }
    // Trusted pointer and keyboard input can run microtasks between native
    // listeners. A frame callback runs after the browser's focus step.
    if (transfer.view?.requestAnimationFrame) {
      transfer.view.requestAnimationFrame(settle);
    } else {
      setTimeout(settle, 0);
    }
  });
}

function recoverAfterRecipientLoss(
  transfer: FocusTransfer | null | undefined,
  recover: (unavailable: Element | null) => void,
): void {
  const unavailable = transfer ? unavailableRecipient(transfer) : null;
  if (transfer?.arrived && unavailable === null) {
    return;
  }
  if (
    unavailable &&
    transfer?.view &&
    isLiveFocusElement(unavailable) &&
    mayRetargetClosedFocus(unavailable)
  ) {
    // This may be a still-live closed shadow descendant or an ordinary host
    // that the browser will blur as it updates rendering. Wait for that signal.
    const view = transfer.view;
    const stop = (): void => unavailable.removeEventListener('focusout', onLoss);
    const onLoss = (nativeEvent: Event): void => {
      const event = nativeEvent as FocusEvent;
      if (event.target === unavailable) {
        stop();
        if (event.relatedTarget === null) {
          queueMicrotask(() => {
            // A programmatic blur dispatched from script has already ended
            // here. Don't reclaim an intentional exit from a closed tree.
            if (event.eventPhase !== 0 && !isRendered(unavailable)) {
              recover(unavailable);
            }
          });
        }
      }
    };
    unavailable.addEventListener('focusout', onLoss);
    view.requestAnimationFrame(() => view.requestAnimationFrame(stop));
    return;
  }
  recover(unavailable);
}

export function recoverAfterFocusTransfer(
  transfer: FocusTransfer | null | undefined,
  recover: (unavailable: Element | null) => void,
): void {
  if (!hasPendingFocusTransfer(transfer)) {
    recoverAfterRecipientLoss(transfer, recover);
  } else if (transfer?.destination && transfer.pending) {
    // The DOM may have retargeted relatedTarget to a shadow host. Let the
    // platform finish, then recover only if nothing took focus.
    afterFocusDispatch(transfer, () => recoverAfterRecipientLoss(transfer, recover));
  }
}

export function observeFocusTransfer(
  anchor: Element,
  onTransfer: (target: Element, transfer: FocusTransfer) => boolean,
): () => void {
  const doc = anchor.ownerDocument;
  const root = getRootNodeSafe(anchor);
  const view = getDefaultView(doc);
  const outer = view ?? doc;
  const scopes = root === doc ? [outer] : [outer, root];
  const pending = new Set<FocusTransfer>();
  const capture = (event: Event): void => {
    const focusEvent = event as FocusEvent;
    const { relatedTarget } = focusEvent;
    const target = event.composedPath()[0] ?? event.target;
    const destination = isElementNode(relatedTarget) ? relatedTarget : null;
    if (!isElementNode(target)) {
      return;
    }
    const transfer: FocusTransfer = {
      event: focusEvent,
      destination,
      view,
      pending: true,
      arrived: null,
    };
    if (onTransfer(target, transfer)) {
      pending.add(transfer);
      afterFocusDispatch(transfer, () => {
        transfer.pending = false;
        pending.delete(transfer);
      });
    }
  };
  const confirmArrival = (event: Event): void => {
    const target = event.composedPath()[0] ?? event.target;
    if (pending.size > 0 && isElementNode(target)) {
      // A retargeted host can already be boxless or hidden when its actual
      // focusable descendant takes focus. Look for a change after arrival.
      const recipient = { element: target, rendered: isRendered(target) };
      for (const transfer of pending) {
        transfer.arrived = recipient;
      }
    }
  };
  // An internal shadow transfer can be invisible at Window and React can
  // already be listening on the shadow root. Native blur precedes focusout.
  for (const scope of scopes) {
    scope.addEventListener('blur', capture, true);
    scope.addEventListener('focusout', capture, true);
    scope.addEventListener('focusin', confirmArrival, true);
  }
  return () => {
    for (const scope of scopes) {
      scope.removeEventListener('blur', capture, true);
      scope.removeEventListener('focusout', capture, true);
      scope.removeEventListener('focusin', confirmArrival, true);
    }
  };
}

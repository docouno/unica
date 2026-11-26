import {
  composedAncestors,
  composedContains,
  getComputedStyleSafe,
  getDeepActiveElement,
  getRootNodeSafe,
  isInertElement,
} from '../../core/dom.js';
import type { DisclosureState } from './context.js';
import { captureScrollAnchor, showFocusTarget } from './scroll.js';

const closingPanel = '[data-unica-disclosure-panel]:not([data-unica-disclosure-open])';

export function activeElement(node: HTMLElement): Element | null {
  return getDeepActiveElement(node.ownerDocument, getRootNodeSafe(node));
}

function hasClosingAncestor(node: Element, except?: Element): boolean {
  for (const ancestor of composedAncestors(node)) {
    if (ancestor !== except && ancestor.matches(closingPanel)) {
      return true;
    }
  }
  return false;
}

export function availableTrigger(button: HTMLButtonElement): boolean {
  return (
    button.isConnected &&
    !button.matches(':disabled, [aria-disabled="true"]') &&
    !hasClosingAncestor(button) &&
    !isInertElement(button) &&
    button.getClientRects().length > 0 &&
    getComputedStyleSafe(button)?.visibility === 'visible' &&
    !Array.from(composedAncestors(button)).some((ancestor) => ancestor.hasAttribute('hidden'))
  );
}

export function returnPanelFocus(
  panel: HTMLElement,
  state: DisclosureState,
): HTMLElement | undefined {
  const root = state.root.current;
  if (!root || !composedContains(panel, activeElement(panel)) || hasClosingAncestor(panel, panel)) {
    return;
  }

  const candidates = Array.from(state.triggers).filter(
    (button) => !composedContains(panel, button) && availableTrigger(button),
  );
  candidates.sort((first, second) => {
    const position = first.compareDocumentPosition(second);
    // Unrelated trees retain ref registration order.
    return position & 1 ? 0 : position & 4 ? -1 : position & 2 ? 1 : 0;
  });
  const preferred = state.preferredTrigger?.(panel);
  const last = state.lastTrigger?.current;
  const target =
    (preferred && availableTrigger(preferred) ? preferred : undefined) ??
    (last && candidates.includes(last) ? last : candidates[0]) ??
    root;

  target.focus({ preventScroll: true });
  if (target !== preferred && activeElement(target) === target) {
    showFocusTarget(target);
    return target;
  }
}

export interface ReturnedFocus {
  readonly update: () => void;
  readonly stop: () => void;
}

export function followReturnedFocus(target: HTMLElement): ReturnedFocus {
  const scroll = captureScrollAnchor(target);
  let stopped = false;
  const unwatch = scroll.watch(stop);

  function stop(): void {
    if (!stopped) {
      stopped = true;
      unwatch();
    }
  }

  function update(): void {
    if (stopped) {
      return;
    }
    if (!target.isConnected || activeElement(target) !== target || !scroll.unchanged()) {
      stop();
      return;
    }
    scroll.keepVisible();
  }

  return { update, stop };
}

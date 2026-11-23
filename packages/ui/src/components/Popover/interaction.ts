import {
  addListenerSafe,
  composedAncestors,
  composedContains,
  getComposedParentElement,
  getComputedStyleSafe,
  getDeepActiveElement,
  getDocumentBody,
  getLiveView,
  getShadowRootSafe,
  isContentEditableSafe,
  isInertElement,
  matchesSafe,
  removeListenerSafe,
} from '../../core/dom.js';
import { focusElement } from '../../core/overlay/dom.js';

export function canUseTrigger(element: HTMLElement): boolean {
  return (
    element.isConnected &&
    !matchesSafe(element, ':disabled, [aria-disabled="true" i]') &&
    !isInertElement(element)
  );
}

export function isVisibleTrigger(element: HTMLElement): boolean {
  const visibility = getComputedStyleSafe(element)?.visibility;
  return (
    visibility !== 'hidden' &&
    visibility !== 'collapse' &&
    element.getClientRects().length > 0 &&
    canUseTrigger(element)
  );
}

const focusable =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, [tabindex], [contenteditable]';

function* composedChildren(parent: Element | ShadowRoot): Iterable<HTMLElement> {
  for (const child of parent.children) {
    const view = getLiveView(child.ownerDocument);
    if (!view) {
      continue;
    }
    if (child instanceof view.HTMLElement) {
      yield child;
    }
    const shadow = getShadowRootSafe(child);
    if (shadow) {
      yield* composedChildren(shadow);
    } else if (child instanceof view.HTMLSlotElement && child.assignedElements().length) {
      for (const assigned of child.assignedElements()) {
        if (assigned instanceof view.HTMLElement) {
          yield assigned;
        }
        yield* composedChildren(assigned);
      }
    } else {
      yield* composedChildren(child);
    }
  }
}

function isContentFocusTarget(element: HTMLElement): boolean {
  if (!matchesSafe(element, focusable) || element.closest('.unica-popover-close')) {
    return false;
  }
  if (element.tabIndex < 0) {
    const parent = getComposedParentElement(element);
    // An editing host can be tabbable with its default tabIndex property of -1.
    if (
      element.hasAttribute('tabindex') ||
      !isContentEditableSafe(element) ||
      (parent && isContentEditableSafe(parent))
    ) {
      return false;
    }
  }
  return isVisibleTrigger(element);
}

export function focusContent(panel: HTMLElement): void {
  const { ownerDocument } = panel;
  for (const element of composedChildren(panel)) {
    if (isContentFocusTarget(element) && focusElement(element, ownerDocument)) {
      return;
    }
  }
  focusElement(panel, ownerDocument);
}

export function trackTabExit(
  panel: HTMLElement,
  inside: (element: Element | null) => boolean,
  onExit: () => void,
): () => void {
  const { ownerDocument: document } = panel;
  const view = getLiveView(document);
  let tab: KeyboardEvent | undefined;
  let timer: number | undefined;
  const clear = (): void => {
    tab = undefined;
    if (timer !== undefined) {
      view?.clearTimeout(timer);
      timer = undefined;
    }
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    clear();
    if (
      event.key === 'Tab' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.isComposing &&
      inside(getDeepActiveElement(document))
    ) {
      tab = event;
      timer = view?.setTimeout(clear, 0);
    }
  };
  const onFocus = (): void => {
    if (!tab || tab.defaultPrevented) {
      return;
    }
    const target = getDeepActiveElement(document);
    if (target && target !== getDocumentBody(document) && !inside(target)) {
      clear();
      onExit();
    }
  };
  addListenerSafe(document, 'keydown', onKeyDown, true);
  addListenerSafe(document, 'focusin', onFocus, true);
  addListenerSafe(document, 'pointerdown', clear, true);
  return () => {
    clear();
    removeListenerSafe(document, 'keydown', onKeyDown, true);
    removeListenerSafe(document, 'focusin', onFocus, true);
    removeListenerSafe(document, 'pointerdown', clear, true);
  };
}

const scrollPanel = 'data-unica-popover-scroll-panel';

/** Reveal the focused control without scrolling the anchor or the page. */
export function revealContentFocus(panel: HTMLDivElement): void {
  const focused = getDeepActiveElement(panel.ownerDocument);
  if (!focused || focused === panel || !composedContains(panel, focused)) {
    return;
  }
  const owner = panel.hasAttribute(scrollPanel)
    ? panel
    : [...composedAncestors(focused)].find((element) =>
        element.classList.contains('unica-popover-body'),
      );
  if (!owner || !composedContains(panel, owner)) {
    return;
  }
  const focusInset = 4;
  const top = owner.getBoundingClientRect().top + owner.clientTop + focusInset;
  const bottom = top + owner.clientHeight - 2 * focusInset;
  const target = focused.getBoundingClientRect();
  if (target.top < top || target.height > bottom - top) {
    owner.scrollTop += target.top - top;
  } else if (target.bottom > bottom) {
    owner.scrollTop += target.bottom - bottom;
  }
}

interface PanelOverflow {
  readonly measure: () => void;
  readonly dispose: () => void;
}

function firstBodyControl(body: Element): HTMLElement | undefined {
  for (const element of composedChildren(body)) {
    if (isContentFocusTarget(element)) {
      return element;
    }
  }
  return undefined;
}

export function trackPanelOverflow(panel: HTMLDivElement, inner: HTMLDivElement): PanelOverflow {
  const view = getLiveView(panel.ownerDocument);
  if (!view?.ResizeObserver) {
    return { measure: () => {}, dispose: () => {} };
  }

  let observedControl: HTMLElement | undefined;
  const observe = (): void => {
    resize.disconnect();
    observedControl = undefined;
    resize.observe(panel);
    for (const child of inner.children) {
      resize.observe(child);
    }
    measure();
  };
  const measure = (): void => {
    if (!panel.matches(':popover-open')) {
      return;
    }
    const style = view.getComputedStyle(panel);
    const gap = Number.parseFloat(style.rowGap) || 0;
    let reserved =
      Number.parseFloat(style.paddingBlockStart) + Number.parseFloat(style.paddingBlockEnd);
    let rows = 0;
    let bodyControl: HTMLElement | undefined;
    for (const slot of inner.children) {
      const layout = view.getComputedStyle(slot);
      if (layout.display === 'none' || layout.position === 'absolute') {
        continue;
      }
      reserved +=
        (Number.parseFloat(layout.marginBlockStart) || 0) +
        (Number.parseFloat(layout.marginBlockEnd) || 0);
      if (slot.classList.contains('unica-popover-body')) {
        const line = slot.firstChild
          ? Number.parseFloat(layout.lineHeight) || Number.parseFloat(layout.fontSize)
          : 0;
        bodyControl = firstBodyControl(slot);
        reserved +=
          Math.max(line, bodyControl?.getBoundingClientRect().height ?? 0) +
          Number.parseFloat(layout.paddingBlockStart) +
          Number.parseFloat(layout.paddingBlockEnd);
      } else {
        reserved += slot.getBoundingClientRect().height;
      }
      rows++;
    }
    if (observedControl !== bodyControl) {
      if (observedControl) {
        resize.unobserve(observedControl);
      }
      observedControl = bodyControl;
      if (bodyControl) {
        resize.observe(bodyControl);
      }
    }
    const fallback = reserved + Math.max(0, rows - 1) * gap > panel.clientHeight + 1;
    if (panel.hasAttribute(scrollPanel) !== fallback) {
      panel.toggleAttribute(scrollPanel, fallback);
      revealContentFocus(panel);
    }
  };
  const resize = new view.ResizeObserver(measure);
  const hierarchy = new view.MutationObserver((records) => {
    if (records.some(({ target, type }) => target === inner && type === 'childList')) {
      observe();
    } else {
      measure();
    }
  });
  hierarchy.observe(inner, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'aria-disabled',
      'class',
      'contenteditable',
      'disabled',
      'hidden',
      'href',
      'inert',
      'style',
      'tabindex',
      'type',
    ],
  });
  observe();
  return {
    measure,
    dispose() {
      resize.disconnect();
      hierarchy.disconnect();
      panel.removeAttribute(scrollPanel);
    },
  };
}

export function measurePanelBlockSize(panel: HTMLElement): number {
  const body = panel.querySelector<HTMLElement>(
    ':scope > .unica-popover-inner > .unica-popover-body',
  );
  return (
    panel.getBoundingClientRect().height +
    Math.max(
      0,
      panel.scrollHeight - panel.clientHeight,
      body ? body.scrollHeight - body.clientHeight : 0,
    )
  );
}

export function inTriggerPath(triggers: ReadonlySet<HTMLElement>, target: Element | null): boolean {
  for (const trigger of triggers) {
    if (composedContains(trigger, target)) {
      return true;
    }
  }
  return false;
}

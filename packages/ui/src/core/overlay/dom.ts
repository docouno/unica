import {
  addListenerSafe,
  composedAncestors,
  composedContains,
  dispatchEventSafe,
  getAssignedSlotSafe,
  getAttributeSafe,
  getComposedParentElement,
  getComputedStyleSafe,
  getDeepActiveElement,
  getDocumentBody,
  getDocumentElement,
  getElementInertSafe,
  getLiveView,
  getLocalName,
  getNodeTypeSafe,
  getOwnerDocument,
  getParentElementSafe,
  getShadowRootSafe,
  hasAttributeSafe,
  isConnectedNode,
  isElementNode,
  matchesSafe,
  parentNodeOf,
  removeAttributeSafe,
  removeListenerSafe,
  setAttributeSafe,
} from '../dom.js';

export {
  addListenerSafe as addListener,
  composedAncestors,
  composedContains,
  dispatchEventSafe as dispatchTargetEvent,
  getAttributeSafe as getAttr,
  getDeepActiveElement as deepFocus,
  getDocumentBody as documentBodyOf,
  getElementInertSafe as getElementInert,
  getLiveView as liveViewOf,
  getOwnerDocument as ownerDocumentOf,
  isConnectedNode,
  isElementNode as isElement,
  matchesSafe as matchesSelector,
  parentNodeOf,
  removeAttributeSafe as removeAttr,
  removeListenerSafe as removeListener,
  setAttributeSafe as setAttr,
};

interface OverlayNativeDom {
  readonly clientWidth: (element: Element) => number;
  readonly htmlStyle: (element: HTMLElement) => CSSStyleDeclaration;
  readonly svgStyle: ((element: SVGElement) => CSSStyleDeclaration) | undefined;
  readonly setInert: ((element: HTMLElement, value: boolean) => void) | undefined;
  readonly getPopover: ((element: HTMLElement) => string | null) | undefined;
  readonly setPopover: ((element: HTMLElement, value: string | null) => void) | undefined;
  readonly dialogOpen: ((dialog: HTMLDialogElement) => boolean) | undefined;
  readonly showModal: ((dialog: HTMLDialogElement) => void) | undefined;
  readonly closeDialog: ((dialog: HTMLDialogElement) => void) | undefined;
  readonly showPopover:
    ((element: HTMLElement, options?: { readonly source?: HTMLElement }) => void) | undefined;
  readonly hidePopover: ((element: HTMLElement) => void) | undefined;
  readonly htmlFocus: (element: HTMLElement, options?: FocusOptions) => void;
  readonly svgFocus: ((element: SVGElement, options?: FocusOptions) => void) | undefined;
  readonly getButtonTarget: ((button: HTMLButtonElement) => Element | null) | undefined;
  readonly setButtonTarget:
    ((button: HTMLButtonElement, value: Element | null) => void) | undefined;
  readonly getInputTarget: ((input: HTMLInputElement) => Element | null) | undefined;
  readonly setInputTarget: ((input: HTMLInputElement, value: Element | null) => void) | undefined;
}

const HIDDEN_TOP_LAYER =
  'dialog:not([open]):not(:popover-open), [popover]:not(:popover-open):not(dialog[open])';

type Getter = (this: unknown) => unknown;
type Setter = (this: unknown, value: unknown) => void;

function getter<T, R>(proto: object | undefined, prop: string): ((target: T) => R) | undefined {
  const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, prop) : undefined;
  const fn = descriptor ? (Reflect.get(descriptor, 'get') as Getter | undefined) : undefined;
  return fn ? (target) => fn.call(target) as R : undefined;
}

function setter<T, V>(
  proto: object | undefined,
  prop: string,
): ((target: T, value: V) => void) | undefined {
  const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, prop) : undefined;
  const fn = descriptor ? (Reflect.get(descriptor, 'set') as Setter | undefined) : undefined;
  return fn
    ? (target, value) => {
        fn.call(target, value);
      }
    : undefined;
}

let cached: OverlayNativeDom | undefined;

function dom(): OverlayNativeDom {
  if (cached) {
    return cached;
  }
  const elementProto = Element.prototype;
  const htmlProto = HTMLElement.prototype;
  const svgProto = typeof SVGElement === 'undefined' ? undefined : SVGElement.prototype;
  const dialogProto =
    typeof HTMLDialogElement === 'undefined' ? undefined : HTMLDialogElement.prototype;
  const buttonProto =
    typeof HTMLButtonElement === 'undefined' ? undefined : HTMLButtonElement.prototype;
  const inputProto =
    typeof HTMLInputElement === 'undefined' ? undefined : HTMLInputElement.prototype;

  cached = {
    clientWidth: getter<Element, number>(elementProto, 'clientWidth')!,
    htmlStyle: getter<HTMLElement, CSSStyleDeclaration>(htmlProto, 'style')!,
    svgStyle: getter<SVGElement, CSSStyleDeclaration>(svgProto, 'style'),
    setInert: setter<HTMLElement, boolean>(htmlProto, 'inert'),
    getPopover: getter<HTMLElement, string | null>(htmlProto, 'popover'),
    setPopover: setter<HTMLElement, string | null>(htmlProto, 'popover'),
    dialogOpen: getter<HTMLDialogElement, boolean>(dialogProto, 'open'),
    showModal: dialogProto?.showModal ? (dialog) => dialogProto.showModal.call(dialog) : undefined,
    closeDialog: dialogProto?.close ? (dialog) => dialogProto.close.call(dialog) : undefined,
    showPopover: htmlProto.showPopover
      ? (element, options) => htmlProto.showPopover.call(element, options)
      : undefined,
    hidePopover: htmlProto.hidePopover
      ? (element) => htmlProto.hidePopover.call(element)
      : undefined,
    htmlFocus: (element, options) => htmlProto.focus.call(element, options),
    svgFocus: svgProto?.focus
      ? (element, options) => {
          svgProto.focus.call(element, options);
        }
      : undefined,
    getButtonTarget: getter<HTMLButtonElement, Element | null>(buttonProto, 'popoverTargetElement'),
    setButtonTarget: setter<HTMLButtonElement, Element | null>(buttonProto, 'popoverTargetElement'),
    getInputTarget: getter<HTMLInputElement, Element | null>(inputProto, 'popoverTargetElement'),
    setInputTarget: setter<HTMLInputElement, Element | null>(inputProto, 'popoverTargetElement'),
  };
  return cached;
}

export function elementStyle(element: Element): CSSStyleDeclaration | null {
  const api = dom();
  try {
    return api.htmlStyle(element as HTMLElement);
  } catch {
    try {
      return api.svgStyle ? api.svgStyle(element as SVGElement) : null;
    } catch {
      return null;
    }
  }
}

export function elementFromTarget(target: EventTarget | null | undefined): Element | null {
  if (!target || typeof target !== 'object') {
    return null;
  }
  const type = getNodeTypeSafe(target);
  if (type === 1) {
    return target as Element;
  }
  if (type === 3) {
    return getAssignedSlotSafe(target as Node) ?? getParentElementSafe(target as Node);
  }
  if (type !== undefined) {
    return getParentElementSafe(target as Node);
  }
  return null;
}

export function setElementInert(element: HTMLElement, value: boolean): void {
  const api = dom();
  if (api.setInert) {
    api.setInert(element, value);
  } else if (value) {
    setAttributeSafe(element, 'inert', '');
  } else {
    removeAttributeSafe(element, 'inert');
  }
}

export function getElementPopover(element: Element): string | null {
  const api = dom();
  if (api.getPopover) {
    try {
      return api.getPopover(element as HTMLElement);
    } catch {
      return null;
    }
  }
  return getAttributeSafe(element, 'popover');
}

export function setElementPopover(element: HTMLElement, value: 'auto' | 'manual'): void {
  const api = dom();
  if (api.setPopover) {
    api.setPopover(element, value);
  } else {
    setAttributeSafe(element, 'popover', value);
  }
}

export function isDialogOpen(dialog: HTMLDialogElement): boolean {
  const api = dom();
  return api.dialogOpen ? api.dialogOpen(dialog) : hasAttributeSafe(dialog, 'open');
}

export function showDialogModal(dialog: HTMLDialogElement): void {
  dom().showModal?.(dialog);
}

export function closeDialog(dialog: HTMLDialogElement): void {
  dom().closeDialog?.(dialog);
}

export function showElementPopover(element: HTMLElement, source?: HTMLElement): void {
  dom().showPopover?.(element, source ? { source } : undefined);
}

export function hideElementPopover(element: HTMLElement): void {
  dom().hidePopover?.(element);
}

export function hasShadowRoot(element: Element): boolean {
  return getShadowRootSafe(element) !== null;
}

export function bindPopoverInvoker(
  trigger: HTMLElement,
  target: Element | null,
): (() => void) | undefined {
  const api = dom();
  const tag = getLocalName(trigger);
  if (tag === 'button' && api.getButtonTarget && api.setButtonTarget) {
    const button = trigger as HTMLButtonElement;
    const previous = api.getButtonTarget(button);
    const previousAttr = getAttributeSafe(button, 'popovertarget');
    api.setButtonTarget(button, target);
    return () => {
      if (previousAttr === null) {
        removeAttributeSafe(button, 'popovertarget');
        api.setButtonTarget?.(button, previous);
      } else {
        api.setButtonTarget?.(button, null);
        setAttributeSafe(button, 'popovertarget', previousAttr);
      }
    };
  }
  if (tag === 'input' && api.getInputTarget && api.setInputTarget) {
    const input = trigger as HTMLInputElement;
    const previous = api.getInputTarget(input);
    const previousAttr = getAttributeSafe(input, 'popovertarget');
    api.setInputTarget(input, target);
    return () => {
      if (previousAttr === null) {
        removeAttributeSafe(input, 'popovertarget');
        api.setInputTarget?.(input, previous);
      } else {
        api.setInputTarget?.(input, null);
        setAttributeSafe(input, 'popovertarget', previousAttr);
      }
    };
  }
  return undefined;
}

export function setPopoverInvokerTarget(trigger: HTMLElement, target: Element | null): boolean {
  const api = dom();
  const tag = getLocalName(trigger);
  if (tag === 'button' && api.setButtonTarget) {
    api.setButtonTarget(trigger as HTMLButtonElement, target);
    return true;
  }
  if (tag === 'input' && api.setInputTarget) {
    api.setInputTarget(trigger as HTMLInputElement, target);
    return true;
  }
  return false;
}

export function hasHiddenAncestor(element: Element, includeSelf: boolean): boolean {
  if (includeSelf && matchesSafe(element, '[hidden]')) {
    return true;
  }
  for (
    let ancestor = getComposedParentElement(element);
    ancestor;
    ancestor = getComposedParentElement(ancestor)
  ) {
    if (matchesSafe(ancestor, `${HIDDEN_TOP_LAYER}, [hidden]`)) {
      return true;
    }
  }
  return false;
}

export function focusElement(element: Element | null, document: Document): boolean {
  if (!element) {
    return false;
  }
  if (
    !isConnectedNode(element) ||
    getOwnerDocument(element) !== document ||
    matchesSafe(element, ':disabled') ||
    hasHiddenAncestor(element, true)
  ) {
    return false;
  }
  // Check local [inert] and CSS interactivity: inert up to (and stopping at) the nearest
  // dialog:modal, leaving modal-stack arbitration to the browser's actual focus() outcome.
  for (
    let current: Element | null = element;
    current;
    current = getComposedParentElement(current)
  ) {
    if (
      getElementInertSafe(current) ||
      hasAttributeSafe(current, 'inert') ||
      getComputedStyleSafe(current)?.getPropertyValue('interactivity') === 'inert'
    ) {
      return false;
    }
    if (matchesSafe(current, 'dialog:modal')) {
      break;
    }
  }

  const api = dom();
  try {
    api.htmlFocus(element as HTMLElement, { preventScroll: true });
  } catch {
    try {
      if (api.svgFocus) {
        api.svgFocus(element as SVGElement, { preventScroll: true });
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
  const active = getDeepActiveElement(document);
  return active !== null && composedContains(element, active);
}

interface PropertySnapshot {
  readonly value: string;
  readonly priority: string;
}

function restoreIfUnchanged(
  style: CSSStyleDeclaration,
  property: string,
  expectedValue: string,
  expectedPriority: string,
  original: PropertySnapshot,
): void {
  if (
    style.getPropertyValue(property) !== expectedValue ||
    style.getPropertyPriority(property) !== expectedPriority
  ) {
    return;
  }
  if (original.value === '') {
    style.removeProperty(property);
  } else {
    style.setProperty(property, original.value, original.priority);
  }
}

export function lockDocumentScroll(document: Document): () => void {
  const api = dom();
  const root = getDocumentElement(document);
  const style = root ? elementStyle(root) : null;
  const view = getLiveView(document);
  if (!root || !style || !view) {
    return () => {};
  }

  const scrollX = view.scrollX;
  const scrollY = view.scrollY;
  const clientWidth = api.clientWidth(root);
  const scrollbarWidth = clientWidth > 0 ? Math.max(0, view.innerWidth - clientWidth) : 0;
  const computed = scrollbarWidth > 0 ? getComputedStyleSafe(root) : null;
  const gutterStable = (computed?.scrollbarGutter ?? '').includes('stable');
  const overflowYBlocksScrollbar =
    computed?.overflowY === 'hidden' || computed?.overflowY === 'clip';
  const compensate = scrollbarWidth > 0 && !gutterStable && !overflowYBlocksScrollbar;

  const originalOverflowX: PropertySnapshot = {
    value: style.getPropertyValue('overflow-x'),
    priority: style.getPropertyPriority('overflow-x'),
  };
  const originalOverflowY: PropertySnapshot = {
    value: style.getPropertyValue('overflow-y'),
    priority: style.getPropertyPriority('overflow-y'),
  };
  const originalPadding: PropertySnapshot | null = compensate
    ? {
        value: style.getPropertyValue('padding-inline-end'),
        priority: style.getPropertyPriority('padding-inline-end'),
      }
    : null;

  let appliedPadding: string | null = null;
  if (compensate && computed) {
    const existing = Number.parseFloat(computed.paddingInlineEnd) || 0;
    appliedPadding = `${existing + scrollbarWidth}px`;
    style.setProperty('padding-inline-end', appliedPadding);
  }
  style.setProperty('overflow-x', 'hidden', 'important');
  style.setProperty('overflow-y', 'hidden', 'important');

  const lockedX = view.scrollX;
  const lockedY = view.scrollY;
  const shiftedOnLock = lockedX !== scrollX || lockedY !== scrollY;
  let released = false;

  return () => {
    if (released) {
      return;
    }
    released = true;

    const currentView = getLiveView(document);
    const unchangedDuringLock =
      currentView !== null &&
      currentView === view &&
      currentView.scrollX === lockedX &&
      currentView.scrollY === lockedY;

    restoreIfUnchanged(style, 'overflow-x', 'hidden', 'important', originalOverflowX);
    restoreIfUnchanged(style, 'overflow-y', 'hidden', 'important', originalOverflowY);
    if (originalPadding && appliedPadding !== null) {
      restoreIfUnchanged(style, 'padding-inline-end', appliedPadding, '', originalPadding);
    }

    if (
      unchangedDuringLock &&
      (shiftedOnLock || currentView.scrollX !== scrollX || currentView.scrollY !== scrollY)
    ) {
      currentView.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    }
  };
}

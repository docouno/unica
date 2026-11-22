// Safe prototype-based DOM accessors immune to HTMLFormElement / Document / Window
// named-property clobbering and safe during Node SSR.

import { resolveOverlayRuntime } from './overlay-protocol.js';

type Realm = Window & typeof globalThis;
type Getter<T, R> = (target: T) => R;
type ZeroArgMethod<T, R> = (target: T) => R;
type OneArgMethod<T, A, R> = (target: T, a: A) => R;
type TwoArgMethod<T, A, B, R> = (target: T, a: A, b: B) => R;
type ListenerMethod = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions | EventListenerOptions,
) => void;

const EMPTY_ARGS: readonly [] = [];

function makeGetter<T, R>(proto: object | undefined, key: PropertyKey): Getter<T, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'get') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const getter = fn as (this: T) => R;
  return (target) => Reflect.apply(getter, target, EMPTY_ARGS);
}

function makeZeroArgMethod<T, R>(
  proto: object | undefined,
  key: PropertyKey,
): ZeroArgMethod<T, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'value') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const callable = fn as (this: T) => R;
  return (target) => Reflect.apply(callable, target, EMPTY_ARGS);
}

function makeOneArgMethod<T, A, R>(
  proto: object | undefined,
  key: PropertyKey,
): OneArgMethod<T, A, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'value') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const callable = fn as (this: T, a: A) => R;
  return (target, a) => Reflect.apply(callable, target, [a]);
}

function makeTwoArgMethod<T, A, B, R>(
  proto: object | undefined,
  key: PropertyKey,
): TwoArgMethod<T, A, B, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'value') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const callable = fn as (this: T, a: A, b: B) => R;
  return (target, a, b) => Reflect.apply(callable, target, [a, b]);
}

function makeListenerMethod(
  proto: object | undefined,
  key: PropertyKey,
): ListenerMethod | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'value') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const callable = fn as (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | EventListenerOptions,
  ) => void;
  return (target, type, listener, options) =>
    Reflect.apply(callable, target, [type, listener, options]);
}

interface DescriptorCache {
  readonly nodeType: Getter<Node, number> | undefined;
  readonly isConnected: Getter<Node, boolean> | undefined;
  readonly parentNode: Getter<Node, ParentNode | null> | undefined;
  readonly parentElement: Getter<Node, HTMLElement | null> | undefined;
  readonly ownerDocument: Getter<Node, Document | null> | undefined;
  readonly getRootNode: ZeroArgMethod<Node, Node> | undefined;
  readonly contains: OneArgMethod<Node, Node | null, boolean> | undefined;
  readonly localName: Getter<Element, string> | undefined;
  readonly namespaceURI: Getter<Element, string | null> | undefined;
  readonly matches: OneArgMethod<Element, string, boolean> | undefined;
  readonly hasAttribute: OneArgMethod<Element, string, boolean> | undefined;
  readonly getAttribute: OneArgMethod<Element, string, string | null> | undefined;
  readonly setAttribute: TwoArgMethod<Element, string, string, void> | undefined;
  readonly removeAttribute: OneArgMethod<Element, string, void> | undefined;
  readonly elementSlot: Getter<Element, HTMLSlotElement | null> | undefined;
  readonly textSlot: Getter<Text, HTMLSlotElement | null> | undefined;
  readonly shadowRoot: Getter<Element, ShadowRoot | null> | undefined;
  readonly shadowHost: Getter<Node, Element | null> | undefined;
  readonly isContentEditable: Getter<HTMLElement, boolean> | undefined;
  readonly htmlInert: Getter<HTMLElement, boolean> | undefined;
  readonly defaultView: Getter<Document, Realm | null> | undefined;
  readonly docActiveElement: Getter<Document, Element | null> | undefined;
  readonly shadowActiveElement: Getter<Node, Element | null> | undefined;
  readonly docElement: Getter<Document, HTMLElement | null> | undefined;
  readonly docFonts: Getter<Document, FontFaceSet> | undefined;
  readonly docBody: Getter<Document, HTMLElement | null> | undefined;
  readonly docHasFocus: ZeroArgMethod<Document, boolean> | undefined;
  readonly docCreateElement: OneArgMethod<Document, string, HTMLElement> | undefined;
  readonly docQuerySelectorAll: OneArgMethod<Document, string, NodeListOf<Element>> | undefined;
  readonly formElements: Getter<HTMLFormElement, HTMLFormControlsCollection> | undefined;
  readonly addEventListener: ListenerMethod | undefined;
  readonly removeEventListener: ListenerMethod | undefined;
  readonly dispatchEvent: OneArgMethod<EventTarget, Event, boolean> | undefined;
}

let cache: DescriptorCache | undefined;

function getCache(): DescriptorCache {
  if (cache) {
    return cache;
  }
  // A Node consumer can supply a DOM window without copying its constructors to globalThis.
  const view = typeof window === 'undefined' ? undefined : window;
  const nodeProto = view?.Node?.prototype;
  const elementProto = view?.Element?.prototype;
  const textProto = view?.Text?.prototype;
  const htmlElementProto = view?.HTMLElement?.prototype;
  const documentProto = view?.Document?.prototype;
  const shadowProto = view?.ShadowRoot?.prototype;
  const formProto = view?.HTMLFormElement?.prototype;
  const targetProto = view?.EventTarget?.prototype;

  const descriptors: DescriptorCache = {
    nodeType: makeGetter<Node, number>(nodeProto, 'nodeType'),
    isConnected: makeGetter<Node, boolean>(nodeProto, 'isConnected'),
    parentNode: makeGetter<Node, ParentNode | null>(nodeProto, 'parentNode'),
    parentElement: makeGetter<Node, HTMLElement | null>(nodeProto, 'parentElement'),
    ownerDocument: makeGetter<Node, Document | null>(nodeProto, 'ownerDocument'),
    getRootNode: makeZeroArgMethod<Node, Node>(nodeProto, 'getRootNode'),
    contains: makeOneArgMethod<Node, Node | null, boolean>(nodeProto, 'contains'),
    localName: makeGetter<Element, string>(elementProto, 'localName'),
    namespaceURI: makeGetter<Element, string | null>(elementProto, 'namespaceURI'),
    matches: makeOneArgMethod<Element, string, boolean>(elementProto, 'matches'),
    hasAttribute: makeOneArgMethod<Element, string, boolean>(elementProto, 'hasAttribute'),
    getAttribute: makeOneArgMethod<Element, string, string | null>(elementProto, 'getAttribute'),
    setAttribute: makeTwoArgMethod<Element, string, string, void>(elementProto, 'setAttribute'),
    removeAttribute: makeOneArgMethod<Element, string, void>(elementProto, 'removeAttribute'),
    elementSlot: makeGetter<Element, HTMLSlotElement | null>(elementProto, 'assignedSlot'),
    textSlot: makeGetter<Text, HTMLSlotElement | null>(textProto, 'assignedSlot'),
    shadowRoot: makeGetter<Element, ShadowRoot | null>(elementProto, 'shadowRoot'),
    shadowHost: makeGetter<Node, Element | null>(shadowProto, 'host'),
    isContentEditable: makeGetter<HTMLElement, boolean>(htmlElementProto, 'isContentEditable'),
    htmlInert: makeGetter<HTMLElement, boolean>(htmlElementProto, 'inert'),
    defaultView: makeGetter<Document, Realm | null>(documentProto, 'defaultView'),
    docActiveElement: makeGetter<Document, Element | null>(documentProto, 'activeElement'),
    shadowActiveElement: makeGetter<Node, Element | null>(shadowProto, 'activeElement'),
    docElement: makeGetter<Document, HTMLElement | null>(documentProto, 'documentElement'),
    docFonts: makeGetter<Document, FontFaceSet>(documentProto, 'fonts'),
    docBody: makeGetter<Document, HTMLElement | null>(documentProto, 'body'),
    docHasFocus: makeZeroArgMethod<Document, boolean>(documentProto, 'hasFocus'),
    docCreateElement: makeOneArgMethod<Document, string, HTMLElement>(
      documentProto,
      'createElement',
    ),
    docQuerySelectorAll: makeOneArgMethod<Document, string, NodeListOf<Element>>(
      documentProto,
      'querySelectorAll',
    ),
    formElements: makeGetter<HTMLFormElement, HTMLFormControlsCollection>(formProto, 'elements'),
    addEventListener: makeListenerMethod(targetProto, 'addEventListener'),
    removeEventListener: makeListenerMethod(targetProto, 'removeEventListener'),
    dispatchEvent: makeOneArgMethod<EventTarget, Event, boolean>(targetProto, 'dispatchEvent'),
  };
  if (documentProto) {
    cache = descriptors;
  }
  return descriptors;
}

export function getNodeTypeSafe(node: unknown): number | undefined {
  if (typeof node !== 'object' || node === null) {
    return undefined;
  }
  const fn = getCache().nodeType;
  if (fn) {
    try {
      return fn(node as Node);
    } catch {
      return undefined;
    }
  }
  return 'nodeType' in node && typeof (node as Node).nodeType === 'number'
    ? (node as Node).nodeType
    : undefined;
}

export function isElementNode(target: unknown): target is Element {
  return getNodeTypeSafe(target) === 1;
}

export function isConnectedNode(node: Node): boolean {
  const fn = getCache().isConnected;
  return fn ? fn(node) : node.isConnected;
}

export function parentNodeOf(node: Node): ParentNode | null {
  const fn = getCache().parentNode;
  return fn ? fn(node) : node.parentNode;
}

export function getLocalName(element: Element): string {
  const fn = getCache().localName;
  return fn ? fn(element) : element.localName;
}

export function getNamespaceURI(element: Element): string | null {
  const fn = getCache().namespaceURI;
  return fn ? fn(element) : element.namespaceURI;
}

export function getOwnerDocument(node: Node): Document | null {
  const fn = getCache().ownerDocument;
  return fn ? fn(node) : node.ownerDocument;
}

export function getParentElementSafe(node: Node): HTMLElement | null {
  const fn = getCache().parentElement;
  return fn ? fn(node) : node.parentElement;
}

export function getAssignedSlotSafe(node: Node): HTMLSlotElement | null {
  const { elementSlot, textSlot } = getCache();
  const type = getNodeTypeSafe(node);
  if (type === 1) {
    try {
      return elementSlot ? elementSlot(node as Element) : ((node as Element).assignedSlot ?? null);
    } catch {
      return null;
    }
  }
  if (type === 3) {
    try {
      return textSlot ? textSlot(node as Text) : ((node as Text).assignedSlot ?? null);
    } catch {
      return null;
    }
  }
  return null;
}

export function getShadowRootSafe(element: Element): ShadowRoot | null {
  const fn = getCache().shadowRoot;
  return fn ? fn(element) : element.shadowRoot;
}

export function getShadowHostSafe(node: Node): Element | null {
  const { nodeType, shadowHost } = getCache();
  if (!shadowHost) {
    return null;
  }
  try {
    // Every ShadowRoot inherits DocumentFragment (nodeType === 11); short-circuit
    // Document/Element roots to avoid throwing TypeError on routine light-DOM walks.
    if (nodeType && nodeType(node) !== 11) {
      return null;
    }
    return shadowHost(node);
  } catch {
    return null;
  }
}

export function getComposedParentElement(node: Node): Element | null {
  const slot = getAssignedSlotSafe(node);
  if (slot) {
    return slot;
  }
  const parent = getParentElementSafe(node);
  if (parent) {
    return parent;
  }
  const parentNode = parentNodeOf(node);
  if (parentNode) {
    return getShadowHostSafe(parentNode);
  }
  return getShadowHostSafe(node);
}

export function* composedAncestors(node: Element | null): Iterable<Element> {
  for (let current = node; current; current = getComposedParentElement(current)) {
    yield current;
  }
}

export function composedContains(parent: Element, child: Element | null): boolean {
  if (!child) {
    return false;
  }
  if (parent === child || containsSafe(parent, child)) {
    return true;
  }
  for (
    let current = getComposedParentElement(child);
    current;
    current = getComposedParentElement(current)
  ) {
    if (current === parent) {
      return true;
    }
  }
  return false;
}

export function isContentEditableSafe(element: Element): boolean {
  const fn = getCache().isContentEditable;
  if (fn) {
    try {
      return fn(element as HTMLElement);
    } catch {
      return false;
    }
  }
  return (element as HTMLElement).isContentEditable === true;
}

export function matchesSafe(element: Element, selector: string): boolean {
  const fn = getCache().matches;
  try {
    return fn ? fn(element, selector) : element.matches(selector);
  } catch {
    return false;
  }
}

export function hasAttributeSafe(element: Element, name: string): boolean {
  const fn = getCache().hasAttribute;
  try {
    return fn ? fn(element, name) : element.hasAttribute(name);
  } catch {
    return false;
  }
}

export function getAttributeSafe(element: Element, name: string): string | null {
  const fn = getCache().getAttribute;
  return fn ? fn(element, name) : element.getAttribute(name);
}

export function setAttributeSafe(element: Element, name: string, value: string): void {
  const fn = getCache().setAttribute;
  if (fn) {
    fn(element, name, value);
  } else {
    element.setAttribute(name, value);
  }
}

export function removeAttributeSafe(element: Element, name: string): void {
  const fn = getCache().removeAttribute;
  if (fn) {
    fn(element, name);
  } else {
    element.removeAttribute(name);
  }
}

export function querySelectorAllSafe(doc: Document, selector: string): readonly Element[] {
  const fn = getCache().docQuerySelectorAll;
  try {
    return Array.from(fn ? fn(doc, selector) : doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}

export function getElementInertSafe(element: Element): boolean {
  const fn = getCache().htmlInert;
  if (fn) {
    try {
      return fn(element as HTMLElement);
    } catch {
      return hasAttributeSafe(element, 'inert');
    }
  }
  return hasAttributeSafe(element, 'inert');
}

export function getRootNodeSafe(node: Node): Node {
  const fn = getCache().getRootNode;
  return fn ? fn(node) : node.getRootNode();
}

export function containsSafe(container: Node, target: EventTarget | null | undefined): boolean {
  if (typeof target !== 'object' || target === null) {
    return false;
  }
  const fn = getCache().contains;
  try {
    return fn ? fn(container, target as Node) : container.contains(target as Node);
  } catch {
    return false;
  }
}

export function getDefaultView(doc: Document | null): Realm | null {
  if (!doc) {
    return null;
  }
  const fn = getCache().defaultView;
  return fn ? fn(doc) : doc.defaultView;
}

export function getLiveView(doc: Document | null): Realm | null {
  const view = getDefaultView(doc);
  if (!view) {
    return null;
  }
  try {
    return view.document === doc ? view : null;
  } catch {
    return null;
  }
}

export function reportErrorSafe(view: Realm | null, error: unknown): void {
  if (view) {
    try {
      const fn: unknown = Reflect.get(view, 'reportError');
      if (typeof fn === 'function') {
        Reflect.apply(fn as (err: unknown) => void, view, [error]);
        return;
      }
    } catch {
      // Ignore detached or restricted views.
    }
  }
  try {
    const fn: unknown = Reflect.get(globalThis, 'reportError');
    if (typeof fn === 'function') {
      Reflect.apply(fn as (err: unknown) => void, globalThis, [error]);
    }
  } catch {
    // Ignore environments without reportError.
  }
}

export function getComputedStyleSafe(element: Element): CSSStyleDeclaration | null {
  const view = getLiveView(getOwnerDocument(element));
  if (!view) {
    return null;
  }
  try {
    const fn: unknown = Reflect.get(view, 'getComputedStyle');
    if (typeof fn !== 'function') {
      return null;
    }
    return Reflect.apply(fn as (el: Element) => CSSStyleDeclaration, view, [element]);
  } catch {
    return null;
  }
}

export function isRTL(element: Element, computed?: CSSStyleDeclaration | null): boolean {
  const style = computed ?? getComputedStyleSafe(element);
  return style?.direction === 'rtl';
}

export function getDocumentElement(doc: Document): HTMLElement | null {
  const fn = getCache().docElement;
  return fn ? fn(doc) : doc.documentElement;
}

export function getDocumentFonts(doc: Document): FontFaceSet | undefined {
  return getCache().docFonts?.(doc);
}

export function getDocumentBody(doc: Document): HTMLElement | null {
  const fn = getCache().docBody;
  return fn ? fn(doc) : doc.body;
}

export function getDocumentActiveElement(doc: Document): Element | null {
  const fn = getCache().docActiveElement;
  return fn ? fn(doc) : doc.activeElement;
}

export function documentHasFocusSafe(doc: Document): boolean {
  const fn = getCache().docHasFocus;
  return fn ? fn(doc) : doc.hasFocus();
}

export function createElementSafe<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
): HTMLElementTagNameMap[K] {
  const fn = getCache().docCreateElement;
  return (fn ? fn(doc, tagName) : doc.createElement(tagName)) as HTMLElementTagNameMap[K];
}

export function getRootActiveElement(root: Node, doc: Document): Element | null {
  if (root === doc) {
    return getDocumentActiveElement(doc);
  }
  const { nodeType, shadowActiveElement } = getCache();
  if (shadowActiveElement) {
    try {
      if (!nodeType || nodeType(root) === 11) {
        return shadowActiveElement(root);
      }
    } catch {
      // Detached element or DocumentFragment without ShadowRoot slot.
    }
  }
  return getDocumentActiveElement(doc);
}

export function getDeepActiveElement(doc: Document, root: Node = doc): Element | null {
  const { shadowActiveElement } = getCache();
  let active = getRootActiveElement(root, doc);
  if (!shadowActiveElement) {
    return active;
  }
  while (active) {
    const shadow = getShadowRootSafe(active);
    if (!shadow) {
      break;
    }
    let nested: Element | null;
    try {
      nested = shadowActiveElement(shadow);
    } catch {
      break;
    }
    if (!nested || nested === active) {
      break;
    }
    active = nested;
  }
  return active;
}

function isNodeLocallyInert(element: Element, checkCss: boolean): boolean {
  if (getElementInertSafe(element) || hasAttributeSafe(element, 'inert')) {
    return true;
  }
  if (!checkCss) {
    return false;
  }
  return getComputedStyleSafe(element)?.getPropertyValue('interactivity') === 'inert';
}

/**
 * Determine whether `element` is inert in observable library/DOM states:
 * explicit `[inert]`, CSS `interactivity: inert` (including `interactivity: auto` descendants
 * under an inert ancestor), tracked Unica modal stacks (including reverse DOM order & Shadow DOM),
 * and background nodes under a light-DOM native `dialog:modal`.
 * Use local scope when the caller already observes modal ownership.
 */
export function isInertElement(
  element: Element,
  scope: 'local' | 'document' = 'document',
): boolean {
  // Step 1: Disconnected nodes check only their local composed ancestors.
  if (!isConnectedNode(element)) {
    for (
      let current: Element | null = element;
      current;
      current = getComposedParentElement(current)
    ) {
      if (isNodeLocallyInert(current, false)) {
        return true;
      }
    }
    return false;
  }

  const doc = scope === 'document' ? getOwnerDocument(element) : null;
  const runtime = doc ? resolveOverlayRuntime(doc) : undefined;
  let activeModal: HTMLDialogElement | null = null;
  if (runtime) {
    try {
      const candidate = runtime.resolveModal(true);
      if (
        candidate &&
        isConnectedNode(candidate) &&
        getOwnerDocument(candidate) === doc &&
        matchesSafe(candidate, 'dialog:modal')
      ) {
        activeModal = candidate;
      }
    } catch {
      activeModal = null;
    }
  }

  // Step 2: Walk composed ancestors starting from `element` inclusive.
  for (
    let current: Element | null = element;
    current;
    current = getComposedParentElement(current)
  ) {
    if (isNodeLocallyInert(current, true)) {
      return true;
    }
    if (matchesSafe(current, 'dialog:modal')) {
      if (activeModal !== null && activeModal !== current) {
        try {
          return runtime?.isTrackedModal?.(current) === true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  // Step 3: Outside any dialog:modal — inert if a tracked or light-DOM modal dialog is open.
  if (activeModal !== null) {
    return true;
  }
  if (doc) {
    return querySelectorAllSafe(doc, 'dialog:modal').length > 0;
  }
  return false;
}

export function isHtmlForm(target: EventTarget | null): target is HTMLFormElement {
  if (!isElementNode(target)) {
    return false;
  }
  return (
    getLocalName(target) === 'form' && getNamespaceURI(target) === 'http://www.w3.org/1999/xhtml'
  );
}

export function getFormElements(form: HTMLFormElement): HTMLFormControlsCollection {
  const fn = getCache().formElements;
  return fn ? fn(form) : form.elements;
}

function resolveEventTarget(target: EventTarget): EventTarget {
  // In VM-proxied test realms (e.g. Vitest jsdom), globalThis wraps jsdom's Window without
  // carrying EventTarget's internal slot; route prototype calls to the underlying Window.
  if (typeof globalThis !== 'undefined' && (target as unknown) === globalThis) {
    const doc = Reflect.get(globalThis, 'document') as Document | null | undefined;
    if (doc) {
      return getDefaultView(doc) ?? target;
    }
  }
  return target;
}

export function addListenerSafe<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListenerSafe<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListenerSafe<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  const resolved = resolveEventTarget(target);
  const fn = getCache().addEventListener;
  if (fn) {
    fn(resolved, type, listener, options);
  } else {
    resolved.addEventListener(type, listener, options);
  }
}

export function removeListenerSafe<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListenerSafe<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListenerSafe<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void;
export function removeListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void {
  const resolved = resolveEventTarget(target);
  const fn = getCache().removeEventListener;
  if (fn) {
    fn(resolved, type, listener, options);
  } else {
    resolved.removeEventListener(type, listener, options);
  }
}

export function dispatchEventSafe(target: EventTarget, event: Event): boolean {
  const resolved = resolveEventTarget(target);
  const fn = getCache().dispatchEvent;
  return fn ? fn(resolved, event) : resolved.dispatchEvent(event);
}

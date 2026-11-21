// Safe prototype-based DOM accessors immune to HTMLFormElement / Document / Window
// named-property clobbering and safe during Node SSR.

type Getter<T, R> = (target: T) => R;
type ZeroArgMethod<T, R> = (target: T) => R;
type OneArgMethod<T, A, R> = (target: T, a: A) => R;
type ListenerMethod = (
  target: EventTarget,
  type: string,
  listener: EventListener,
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
    listener: EventListener,
    options?: boolean | AddEventListenerOptions | EventListenerOptions,
  ) => void;
  return (target, type, listener, options) =>
    Reflect.apply(callable, target, [type, listener, options]);
}

interface DescriptorCache {
  readonly nodeType: Getter<Node, number> | undefined;
  readonly parentElement: Getter<Node, HTMLElement | null> | undefined;
  readonly ownerDocument: Getter<Node, Document | null> | undefined;
  readonly getRootNode: ZeroArgMethod<Node, Node> | undefined;
  readonly contains: OneArgMethod<Node, Node | null, boolean> | undefined;
  readonly localName: Getter<Element, string> | undefined;
  readonly namespaceURI: Getter<Element, string | null> | undefined;
  readonly shadowRoot: Getter<Element, ShadowRoot | null> | undefined;
  readonly shadowHost: Getter<Node, Element | null> | undefined;
  readonly isContentEditable: Getter<HTMLElement, boolean> | undefined;
  readonly defaultView: Getter<Document, (Window & typeof globalThis) | null> | undefined;
  readonly docActiveElement: Getter<Document, Element | null> | undefined;
  readonly shadowActiveElement: Getter<Node, Element | null> | undefined;
  readonly docBody: Getter<Document, HTMLElement | null> | undefined;
  readonly docHasFocus: ZeroArgMethod<Document, boolean> | undefined;
  readonly docCreateElement: OneArgMethod<Document, string, HTMLElement> | undefined;
  readonly formElements: Getter<HTMLFormElement, HTMLFormControlsCollection> | undefined;
  readonly addEventListener: ListenerMethod | undefined;
  readonly removeEventListener: ListenerMethod | undefined;
}

let cache: DescriptorCache | undefined;

function getCache(): DescriptorCache {
  if (cache) {
    return cache;
  }
  const nodeProto = typeof Node !== 'undefined' ? Node.prototype : undefined;
  const elementProto = typeof Element !== 'undefined' ? Element.prototype : undefined;
  const htmlElementProto = typeof HTMLElement !== 'undefined' ? HTMLElement.prototype : undefined;
  const documentProto = typeof Document !== 'undefined' ? Document.prototype : undefined;
  const shadowProto = typeof ShadowRoot !== 'undefined' ? ShadowRoot.prototype : undefined;
  const formProto = typeof HTMLFormElement !== 'undefined' ? HTMLFormElement.prototype : undefined;
  const targetProto = typeof EventTarget !== 'undefined' ? EventTarget.prototype : undefined;

  cache = {
    nodeType: makeGetter<Node, number>(nodeProto, 'nodeType'),
    parentElement: makeGetter<Node, HTMLElement | null>(nodeProto, 'parentElement'),
    ownerDocument: makeGetter<Node, Document | null>(nodeProto, 'ownerDocument'),
    getRootNode: makeZeroArgMethod<Node, Node>(nodeProto, 'getRootNode'),
    contains: makeOneArgMethod<Node, Node | null, boolean>(nodeProto, 'contains'),
    localName: makeGetter<Element, string>(elementProto, 'localName'),
    namespaceURI: makeGetter<Element, string | null>(elementProto, 'namespaceURI'),
    shadowRoot: makeGetter<Element, ShadowRoot | null>(elementProto, 'shadowRoot'),
    shadowHost: makeGetter<Node, Element | null>(shadowProto, 'host'),
    isContentEditable: makeGetter<HTMLElement, boolean>(htmlElementProto, 'isContentEditable'),
    defaultView: makeGetter<Document, (Window & typeof globalThis) | null>(
      documentProto,
      'defaultView',
    ),
    docActiveElement: makeGetter<Document, Element | null>(documentProto, 'activeElement'),
    shadowActiveElement: makeGetter<Node, Element | null>(shadowProto, 'activeElement'),
    docBody: makeGetter<Document, HTMLElement | null>(documentProto, 'body'),
    docHasFocus: makeZeroArgMethod<Document, boolean>(documentProto, 'hasFocus'),
    docCreateElement: makeOneArgMethod<Document, string, HTMLElement>(
      documentProto,
      'createElement',
    ),
    formElements: makeGetter<HTMLFormElement, HTMLFormControlsCollection>(formProto, 'elements'),
    addEventListener: makeListenerMethod(targetProto, 'addEventListener'),
    removeEventListener: makeListenerMethod(targetProto, 'removeEventListener'),
  };
  return cache;
}

export function isElementNode(target: EventTarget | null | undefined): target is Element {
  if (typeof target !== 'object' || target === null) {
    return false;
  }
  const fn = getCache().nodeType;
  if (fn) {
    try {
      return fn(target as Node) === 1;
    } catch {
      return false;
    }
  }
  return 'nodeType' in target && (target as Node).nodeType === 1;
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

function getParentElement(node: Node): HTMLElement | null {
  const fn = getCache().parentElement;
  return fn ? fn(node) : node.parentElement;
}

function getShadowRootSafe(element: Element): ShadowRoot | null {
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
  const parent = getParentElement(node);
  if (parent) {
    return parent;
  }
  return getShadowHostSafe(getRootNodeSafe(node));
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

export function getDefaultView(doc: Document | null): (Window & typeof globalThis) | null {
  if (!doc) {
    return null;
  }
  const fn = getCache().defaultView;
  return fn ? fn(doc) : doc.defaultView;
}

export function getComputedStyleSafe(element: Element): CSSStyleDeclaration | null {
  const view = getDefaultView(getOwnerDocument(element));
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

export function getDeepActiveElement(doc: Document): Element | null {
  const { shadowActiveElement } = getCache();
  let active = getDocumentActiveElement(doc);
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

export function addListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions,
): void {
  const fn = getCache().addEventListener;
  if (fn) {
    fn(target, type, listener, options);
  } else {
    target.addEventListener(type, listener, options);
  }
}

export function removeListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | EventListenerOptions,
): void {
  const fn = getCache().removeEventListener;
  if (fn) {
    fn(target, type, listener, options);
  } else {
    target.removeEventListener(type, listener, options);
  }
}

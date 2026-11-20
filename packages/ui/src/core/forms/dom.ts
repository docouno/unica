// Safe prototype-based DOM accessors immune to HTMLFormElement / Document
// [LegacyOverrideBuiltIns] named-property clobbering and safe during Node SSR.

type Getter<T, R> = (target: T) => R;
type Method<T, A extends unknown[], R> = (target: T, ...args: A) => R;

function makeGetter<T, R>(proto: object | undefined, key: PropertyKey): Getter<T, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'get') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const getter = fn as (this: T) => R;
  return (target) => Reflect.apply(getter, target, []);
}

function makeMethod<T, A extends unknown[], R>(
  proto: object | undefined,
  key: PropertyKey,
): Method<T, A, R> | undefined {
  const desc = proto ? Object.getOwnPropertyDescriptor(proto, key) : undefined;
  const fn: unknown = desc ? Reflect.get(desc, 'value') : undefined;
  if (typeof fn !== 'function') {
    return undefined;
  }
  const callable = fn as (this: T, ...args: A) => R;
  return (target, ...args) => Reflect.apply(callable, target, args);
}

interface DescriptorCache {
  readonly parentNode: Getter<Node, Node | null> | undefined;
  readonly ownerDocument: Getter<Node, Document | null> | undefined;
  readonly getRootNode: Method<Node, [GetRootNodeOptions?], Node> | undefined;
  readonly localName: Getter<Element, string> | undefined;
  readonly namespaceURI: Getter<Element, string | null> | undefined;
  readonly defaultView: Getter<Document, (Window & typeof globalThis) | null> | undefined;
  readonly docActiveElement: Getter<Document, Element | null> | undefined;
  readonly shadowActiveElement: Getter<Node, Element | null> | undefined;
  readonly docBody: Getter<Document, HTMLElement | null> | undefined;
  readonly docHasFocus: Method<Document, [], boolean> | undefined;
  readonly docCreateElement: Method<Document, [string], HTMLElement> | undefined;
  readonly formElements: Getter<HTMLFormElement, HTMLFormControlsCollection> | undefined;
  readonly addEventListener:
    | Method<EventTarget, [string, EventListener, (boolean | AddEventListenerOptions)?], void>
    | undefined;
  readonly removeEventListener:
    | Method<EventTarget, [string, EventListener, (boolean | EventListenerOptions)?], void>
    | undefined;
}

let cache: DescriptorCache | undefined;

function getCache(): DescriptorCache {
  if (cache) {
    return cache;
  }
  const nodeProto = typeof Node !== 'undefined' ? Node.prototype : undefined;
  const elementProto = typeof Element !== 'undefined' ? Element.prototype : undefined;
  const documentProto = typeof Document !== 'undefined' ? Document.prototype : undefined;
  const shadowProto = typeof ShadowRoot !== 'undefined' ? ShadowRoot.prototype : undefined;
  const formProto = typeof HTMLFormElement !== 'undefined' ? HTMLFormElement.prototype : undefined;
  const targetProto = typeof EventTarget !== 'undefined' ? EventTarget.prototype : undefined;

  cache = {
    parentNode: makeGetter<Node, Node | null>(nodeProto, 'parentNode'),
    ownerDocument: makeGetter<Node, Document | null>(nodeProto, 'ownerDocument'),
    getRootNode: makeMethod<Node, [GetRootNodeOptions?], Node>(nodeProto, 'getRootNode'),
    localName: makeGetter<Element, string>(elementProto, 'localName'),
    namespaceURI: makeGetter<Element, string | null>(elementProto, 'namespaceURI'),
    defaultView: makeGetter<Document, (Window & typeof globalThis) | null>(
      documentProto,
      'defaultView',
    ),
    docActiveElement: makeGetter<Document, Element | null>(documentProto, 'activeElement'),
    shadowActiveElement: makeGetter<Node, Element | null>(shadowProto, 'activeElement'),
    docBody: makeGetter<Document, HTMLElement | null>(documentProto, 'body'),
    docHasFocus: makeMethod<Document, [], boolean>(documentProto, 'hasFocus'),
    docCreateElement: makeMethod<Document, [string], HTMLElement>(documentProto, 'createElement'),
    formElements: makeGetter<HTMLFormElement, HTMLFormControlsCollection>(formProto, 'elements'),
    addEventListener: makeMethod(targetProto, 'addEventListener'),
    removeEventListener: makeMethod(targetProto, 'removeEventListener'),
  };
  return cache;
}

export function getOwnerDocument(node: Node): Document | null {
  const fn = getCache().ownerDocument;
  return fn ? fn(node) : node.ownerDocument;
}

export function getParentNode(node: Node): Node | null {
  const fn = getCache().parentNode;
  return fn ? fn(node) : node.parentNode;
}

export function getRootNodeSafe(node: Node): Node {
  const fn = getCache().getRootNode;
  return fn ? fn(node) : node.getRootNode();
}

export function getDefaultView(doc: Document | null): (Window & typeof globalThis) | null {
  if (!doc) {
    return null;
  }
  const fn = getCache().defaultView;
  return fn ? fn(doc) : doc.defaultView;
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
  const fn = getCache().shadowActiveElement;
  if (fn) {
    try {
      return fn(root);
    } catch {
      // Detached element or DocumentFragment without ShadowRoot slot.
    }
  }
  return getDocumentActiveElement(doc);
}

export function isHtmlForm(target: EventTarget | null): target is HTMLFormElement {
  if (typeof target !== 'object' || target === null || !('nodeType' in target)) {
    return false;
  }
  const node = target as Node;
  if (node.nodeType !== 1) {
    return false;
  }
  const element = node as Element;
  const { localName, namespaceURI } = getCache();
  const tag = localName ? localName(element) : element.localName;
  if (tag !== 'form') {
    return false;
  }
  const ns = namespaceURI ? namespaceURI(element) : element.namespaceURI;
  return ns === 'http://www.w3.org/1999/xhtml';
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

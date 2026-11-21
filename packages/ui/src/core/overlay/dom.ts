type Realm = Window & typeof globalThis;

interface NativeDom {
  readonly addEventListener: (
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  readonly removeEventListener: (
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
  readonly dispatchEvent: (target: EventTarget, event: Event) => boolean;
  readonly nodeType: (node: Node) => number;
  readonly isConnected: (node: Node) => boolean;
  readonly ownerDocument: (node: Node) => Document | null;
  readonly parentNode: (node: Node) => ParentNode | null;
  readonly parentElement: (node: Node) => HTMLElement | null;
  readonly contains: (parent: Node, child: Node | null) => boolean;
  readonly matches: (element: Element, selector: string) => boolean;
  readonly localName: (element: Element) => string;
  readonly clientWidth: (element: Element) => number;
  readonly getAttribute: (element: Element, name: string) => string | null;
  readonly setAttribute: (element: Element, name: string, value: string) => void;
  readonly removeAttribute: (element: Element, name: string) => void;
  readonly elementSlot: (element: Element) => HTMLSlotElement | null;
  readonly textSlot: ((text: Text) => HTMLSlotElement | null) | undefined;
  readonly shadowRoot: (element: Element) => ShadowRoot | null;
  readonly shadowHost: ((root: Node) => Element) | undefined;
  readonly shadowActiveElement: ((root: ShadowRoot) => Element | null) | undefined;
  readonly docActiveElement: (document: Document) => Element | null;
  readonly docDefaultView: (document: Document) => Realm | null;
  readonly docElement: (document: Document) => Element | null;
  readonly docBody: (document: Document) => HTMLElement | null;
  readonly htmlStyle: (element: HTMLElement) => CSSStyleDeclaration;
  readonly svgStyle: ((element: SVGElement) => CSSStyleDeclaration) | undefined;
  readonly getInert: ((element: HTMLElement) => boolean) | undefined;
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

let cached: NativeDom | undefined;

function dom(): NativeDom {
  if (cached) {
    return cached;
  }
  const eventTargetProto = EventTarget.prototype;
  const nodeProto = Node.prototype;
  const elementProto = Element.prototype;
  const htmlProto = HTMLElement.prototype;
  const svgProto = typeof SVGElement === 'undefined' ? undefined : SVGElement.prototype;
  const docProto = Document.prototype;
  const shadowProto = typeof ShadowRoot === 'undefined' ? undefined : ShadowRoot.prototype;
  const dialogProto =
    typeof HTMLDialogElement === 'undefined' ? undefined : HTMLDialogElement.prototype;
  const buttonProto =
    typeof HTMLButtonElement === 'undefined' ? undefined : HTMLButtonElement.prototype;
  const inputProto =
    typeof HTMLInputElement === 'undefined' ? undefined : HTMLInputElement.prototype;

  cached = {
    addEventListener: (target, type, listener, options) => {
      eventTargetProto.addEventListener.call(target, type, listener, options);
    },
    removeEventListener: (target, type, listener, options) => {
      eventTargetProto.removeEventListener.call(target, type, listener, options);
    },
    dispatchEvent: (target, event) => eventTargetProto.dispatchEvent.call(target, event),
    nodeType: getter<Node, number>(nodeProto, 'nodeType')!,
    isConnected: getter<Node, boolean>(nodeProto, 'isConnected')!,
    ownerDocument: getter<Node, Document | null>(nodeProto, 'ownerDocument')!,
    parentNode: getter<Node, ParentNode | null>(nodeProto, 'parentNode')!,
    parentElement: getter<Node, HTMLElement | null>(nodeProto, 'parentElement')!,
    contains: (parent, child) => nodeProto.contains.call(parent, child),
    matches: (element, selector) => elementProto.matches.call(element, selector),
    localName: getter<Element, string>(elementProto, 'localName')!,
    clientWidth: getter<Element, number>(elementProto, 'clientWidth')!,
    getAttribute: (element, name) => elementProto.getAttribute.call(element, name),
    setAttribute: (element, name, value) => elementProto.setAttribute.call(element, name, value),
    removeAttribute: (element, name) => elementProto.removeAttribute.call(element, name),
    elementSlot: getter<Element, HTMLSlotElement | null>(elementProto, 'assignedSlot')!,
    textSlot:
      typeof Text === 'undefined'
        ? undefined
        : getter<Text, HTMLSlotElement | null>(Text.prototype, 'assignedSlot'),
    shadowRoot: getter<Element, ShadowRoot | null>(elementProto, 'shadowRoot')!,
    shadowHost: getter<Node, Element>(shadowProto, 'host'),
    shadowActiveElement: getter<ShadowRoot, Element | null>(shadowProto, 'activeElement'),
    docActiveElement: getter<Document, Element | null>(docProto, 'activeElement')!,
    docDefaultView: getter<Document, Realm | null>(docProto, 'defaultView')!,
    docElement: getter<Document, Element | null>(docProto, 'documentElement')!,
    docBody: getter<Document, HTMLElement | null>(docProto, 'body')!,
    htmlStyle: getter<HTMLElement, CSSStyleDeclaration>(htmlProto, 'style')!,
    svgStyle: getter<SVGElement, CSSStyleDeclaration>(svgProto, 'style'),
    getInert: getter<HTMLElement, boolean>(htmlProto, 'inert'),
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

export function addListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void;
export function addListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  dom().addEventListener(target, type, listener, options);
}

export function removeListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void;
export function removeListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void;
export function removeListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void {
  dom().removeEventListener(target, type, listener, options);
}

export function dispatchTargetEvent(target: EventTarget, event: Event): boolean {
  return dom().dispatchEvent(target, event);
}

export function liveViewOf(document: Document): Realm | null {
  const view = dom().docDefaultView(document);
  if (!view) {
    return null;
  }
  try {
    return view.document === document ? view : null;
  } catch {
    return null;
  }
}

export function documentBodyOf(document: Document): HTMLElement | null {
  return dom().docBody(document);
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

export function isElement(node: unknown): node is Element {
  if (!node || typeof node !== 'object') {
    return false;
  }
  try {
    return dom().nodeType(node as Node) === 1;
  } catch {
    return false;
  }
}

export function elementFromTarget(target: EventTarget | null | undefined): Element | null {
  if (!target || typeof target !== 'object') {
    return null;
  }
  try {
    const api = dom();
    const type = api.nodeType(target as Node);
    if (type === 1) {
      return target as Element;
    }
    if (type === 3) {
      return api.textSlot?.(target as Text) ?? api.parentElement(target as Node);
    }
    return api.parentElement(target as Node);
  } catch {
    return null;
  }
}

function isShadowRoot(node: Node | null): node is ShadowRoot {
  if (!node) {
    return false;
  }
  const api = dom();
  if (!api.shadowHost) {
    return false;
  }
  try {
    if (api.nodeType(node) !== 11) {
      return false;
    }
    return api.shadowHost(node) !== undefined;
  } catch {
    return false;
  }
}

export function isConnectedNode(node: Node): boolean {
  return dom().isConnected(node);
}

export function ownerDocumentOf(node: Node): Document | null {
  return dom().ownerDocument(node);
}

export function parentNodeOf(node: Node): ParentNode | null {
  return dom().parentNode(node);
}

export function matchesSelector(element: Element, selector: string): boolean {
  return dom().matches(element, selector);
}

export function getAttr(element: Element, name: string): string | null {
  return dom().getAttribute(element, name);
}

export function setAttr(element: Element, name: string, value: string): void {
  dom().setAttribute(element, name, value);
}

export function removeAttr(element: Element, name: string): void {
  dom().removeAttribute(element, name);
}

export function getElementInert(element: HTMLElement): boolean {
  const api = dom();
  return api.getInert ? api.getInert(element) : api.getAttribute(element, 'inert') !== null;
}

export function setElementInert(element: HTMLElement, value: boolean): void {
  const api = dom();
  if (api.setInert) {
    api.setInert(element, value);
  } else if (value) {
    api.setAttribute(element, 'inert', '');
  } else {
    api.removeAttribute(element, 'inert');
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
  return api.getAttribute(element, 'popover');
}

export function setElementPopover(element: HTMLElement, value: 'auto' | 'manual'): void {
  const api = dom();
  if (api.setPopover) {
    api.setPopover(element, value);
  } else {
    api.setAttribute(element, 'popover', value);
  }
}

export function isDialogOpen(dialog: HTMLDialogElement): boolean {
  const api = dom();
  return api.dialogOpen ? api.dialogOpen(dialog) : api.getAttribute(dialog, 'open') !== null;
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
  return dom().shadowRoot(element) !== null;
}

export function bindPopoverInvoker(
  trigger: HTMLElement,
  target: Element | null,
): (() => void) | undefined {
  const api = dom();
  const tag = api.localName(trigger);
  if (tag === 'button' && api.getButtonTarget && api.setButtonTarget) {
    const button = trigger as HTMLButtonElement;
    const previous = api.getButtonTarget(button);
    const previousAttr = api.getAttribute(button, 'popovertarget');
    api.setButtonTarget(button, target);
    return () => {
      if (previousAttr === null) {
        api.removeAttribute(button, 'popovertarget');
        api.setButtonTarget?.(button, previous);
      } else {
        api.setButtonTarget?.(button, null);
        api.setAttribute(button, 'popovertarget', previousAttr);
      }
    };
  }
  if (tag === 'input' && api.getInputTarget && api.setInputTarget) {
    const input = trigger as HTMLInputElement;
    const previous = api.getInputTarget(input);
    const previousAttr = api.getAttribute(input, 'popovertarget');
    api.setInputTarget(input, target);
    return () => {
      if (previousAttr === null) {
        api.removeAttribute(input, 'popovertarget');
        api.setInputTarget?.(input, previous);
      } else {
        api.setInputTarget?.(input, null);
        api.setAttribute(input, 'popovertarget', previousAttr);
      }
    };
  }
  return undefined;
}

export function setPopoverInvokerTarget(trigger: HTMLElement, target: Element | null): boolean {
  const api = dom();
  const tag = api.localName(trigger);
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

function composedParent(element: Element): Element | null {
  const api = dom();
  const slot = api.elementSlot(element);
  if (slot) {
    return slot;
  }
  const parent = api.parentElement(element);
  if (parent) {
    return parent;
  }
  const parentNode = api.parentNode(element);
  return isShadowRoot(parentNode) && api.shadowHost ? api.shadowHost(parentNode) : null;
}

export function* composedAncestors(node: Element | null): Iterable<Element> {
  for (let element = node; element; element = composedParent(element)) {
    yield element;
  }
}

export function composedContains(parent: Element, child: Element | null): boolean {
  if (!child) {
    return false;
  }
  if (parent === child || dom().contains(parent, child)) {
    return true;
  }
  for (let current = composedParent(child); current; current = composedParent(current)) {
    if (current === parent) {
      return true;
    }
  }
  return false;
}

export function deepFocus(document: Document): Element | null {
  const api = dom();
  let active = api.docActiveElement(document);
  while (active) {
    const shadow = api.shadowRoot(active);
    const inner = shadow && api.shadowActiveElement ? api.shadowActiveElement(shadow) : null;
    if (!inner || inner === active) {
      break;
    }
    active = inner;
  }
  return active;
}

export function hasHiddenAncestor(element: Element, includeSelf: boolean): boolean {
  const api = dom();
  if (includeSelf && api.matches(element, '[hidden]')) {
    return true;
  }
  for (let ancestor = composedParent(element); ancestor; ancestor = composedParent(ancestor)) {
    if (api.matches(ancestor, `${HIDDEN_TOP_LAYER}, [hidden]`)) {
      return true;
    }
  }
  return false;
}

export function focusElement(element: Element | null, document: Document): boolean {
  if (!element) {
    return false;
  }
  const api = dom();
  if (
    !api.isConnected(element) ||
    api.ownerDocument(element) !== document ||
    api.matches(element, ':disabled')
  ) {
    return false;
  }
  for (let current: Element | null = element; current; current = composedParent(current)) {
    if (api.matches(current, '[inert], [hidden]')) {
      return false;
    }
    if (current !== element && api.matches(current, HIDDEN_TOP_LAYER)) {
      return false;
    }
  }

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
  const active = deepFocus(document);
  return active !== null && composedContains(element, active);
}

export function lockDocumentScroll(document: Document): () => void {
  const api = dom();
  const root = api.docElement(document);
  const style = root ? elementStyle(root) : null;
  const view = liveViewOf(document);
  if (!root || !style || !view) {
    return () => {};
  }
  const scrollX = view.scrollX;
  const scrollY = view.scrollY;
  const scrollbarWidth = Math.max(0, view.innerWidth - api.clientWidth(root));
  const computed = scrollbarWidth > 0 ? view.getComputedStyle(root) : null;
  const compensate = scrollbarWidth > 0 && !(computed?.scrollbarGutter ?? '').includes('stable');

  const properties = [
    ...(style.getPropertyValue('overflow') ? ['overflow'] : ['overflow-x', 'overflow-y']),
    ...(compensate ? ['padding-inline-end'] : []),
  ];
  const original = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));

  if (compensate && computed) {
    const existing = Number.parseFloat(computed.paddingInlineEnd) || 0;
    style.setProperty('padding-inline-end', `${existing + scrollbarWidth}px`);
  }
  style.setProperty('overflow', 'hidden', 'important');

  const lockedX = view.scrollX;
  const lockedY = view.scrollY;
  const shiftedOnLock = lockedX !== scrollX || lockedY !== scrollY;

  return () => {
    const currentView = liveViewOf(document);
    const unchangedDuringLock =
      currentView !== null &&
      currentView === view &&
      currentView.scrollX === lockedX &&
      currentView.scrollY === lockedY;

    style.removeProperty('overflow');
    if (compensate) {
      style.removeProperty('padding-inline-end');
    }
    for (const { property, value, priority } of original) {
      style.setProperty(property, value, priority);
    }

    if (
      unchangedDuringLock &&
      (shiftedOnLock || currentView.scrollX !== scrollX || currentView.scrollY !== scrollY)
    ) {
      currentView.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    }
  };
}

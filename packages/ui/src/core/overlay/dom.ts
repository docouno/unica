export function isShadowRoot(node: Node | null): node is ShadowRoot {
  return node?.nodeType === 11 && 'host' in node;
}

export function* composedAncestors(node: Element | null): Iterable<Element> {
  for (let element = node; element;) {
    yield element;
    const root = element.getRootNode();
    const host = isShadowRoot(root) ? root.host : null;
    element = element.assignedSlot ?? element.parentElement ?? host;
  }
}

export function composedContains(parent: Element, child: Element | null): boolean {
  for (const ancestor of composedAncestors(child)) {
    if (ancestor === parent) {
      return true;
    }
  }
  return false;
}

export function watchSlotAssignments(
  ancestry: Iterable<Element>,
  onChange: () => void,
): () => void {
  const roots = new Set<ShadowRoot>();
  for (const element of ancestry) {
    const root = element.getRootNode();
    if (isShadowRoot(root)) {
      roots.add(root);
    }
    if (element.shadowRoot) {
      roots.add(element.shadowRoot);
    }
  }
  for (const root of roots) {
    root.addEventListener('slotchange', onChange);
  }
  return () => {
    for (const root of roots) {
      root.removeEventListener('slotchange', onChange);
    }
  };
}

export function deepFocus(document: Document): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

export function focusElement(element: Element | null, document: Document): void {
  if (
    element?.isConnected &&
    element.ownerDocument === document &&
    'focus' in element &&
    !element.matches(':disabled') &&
    !Array.from(composedAncestors(element)).some((ancestor) =>
      ancestor.matches('[inert], [hidden]'),
    )
  ) {
    (element as HTMLElement).focus({ preventScroll: true });
  }
}

export function lockDocumentScroll(document: Document, view: Window): () => void {
  const { style } = document.documentElement;
  const { scrollX, scrollY } = view;
  const properties = style.getPropertyValue('overflow')
    ? ['overflow']
    : ['overflow-x', 'overflow-y'];
  const original = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));

  style.setProperty('overflow', 'hidden', 'important');
  return () => {
    style.removeProperty('overflow');
    for (const { property, value, priority } of original) {
      style.setProperty(property, value, priority);
    }
    if (view.scrollX !== scrollX || view.scrollY !== scrollY) {
      view.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    }
  };
}

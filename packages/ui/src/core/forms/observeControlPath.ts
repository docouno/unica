import {
  getDefaultView,
  getLocalName,
  getOwnerDocument,
  getShadowHostSafe,
  isElementNode,
  parentNodeOf,
} from '../dom.js';

/** Recheck native availability after a move or a change to a containing fieldset. */
export function observeControlPath(
  element: HTMLElement,
  onChange: () => void,
  ancestorAttributes: readonly string[] = [],
): () => void {
  const inheritedAttributes = [...ancestorAttributes];
  const availabilityAttributes = ['disabled', ...inheritedAttributes];
  let path: Node[] = [];
  let observer: MutationObserver | undefined;
  let connection: ResizeObserver | undefined;

  function sync(): void {
    onChange();

    const nextPath: Node[] = [];
    for (
      let node: Node | null = element;
      node;
      node = parentNodeOf(node) ?? getShadowHostSafe(node)
    ) {
      nextPath.push(node);
    }
    if (path.length === nextPath.length && path.every((node, index) => node === nextPath[index])) {
      return;
    }
    path = nextPath;
    observer?.disconnect();
    connection?.disconnect();

    const realm = getDefaultView(getOwnerDocument(element));
    if (!realm) {
      return;
    }
    observer = new realm.MutationObserver(sync);
    // A detached host can enter light DOM or a shadow tree beyond the current path.
    if (!element.isConnected) {
      observer.observe(element.ownerDocument, { childList: true, subtree: true });
      if (realm.ResizeObserver) {
        connection = new realm.ResizeObserver(sync);
        connection.observe(element);
      }
    }
    // Changes to direct children can change the first legend or move the path.
    for (const node of path) {
      const affectsAvailability =
        node === element || (isElementNode(node) && getLocalName(node) === 'fieldset');
      const attributeFilter = affectsAvailability ? availabilityAttributes : inheritedAttributes;
      observer.observe(
        node,
        attributeFilter.length && isElementNode(node)
          ? { childList: true, attributes: true, attributeFilter }
          : { childList: true },
      );
    }
  }

  sync();
  return () => {
    observer?.disconnect();
    connection?.disconnect();
  };
}

/** Determine the native fieldset restriction for a group rendered on a div. */
export function isInsideDisabledFieldset(group: HTMLElement): boolean {
  for (let parent = group.parentElement; parent; parent = parent.parentElement) {
    if (parent.localName === 'fieldset' && parent.hasAttribute('disabled')) {
      const legend = Array.from(parent.children).find((child) => child.localName === 'legend');
      if (!legend?.contains(group)) {
        return true;
      }
    }
  }
  return false;
}

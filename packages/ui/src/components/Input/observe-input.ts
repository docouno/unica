import {
  getDefaultView,
  getLocalName,
  getOwnerDocument,
  getShadowHostSafe,
  isElementNode,
  parentNodeOf,
} from '../../core/dom.js';
import { subscribeFocusOrigin } from '../../core/focus-origin.js';

export function observeInput(
  input: HTMLInputElement,
  onDisabled: (disabled: boolean) => void,
): () => void {
  let root: Node | undefined;
  let path: Node[] = [];
  let observer: MutationObserver | undefined;
  let releaseFocus: (() => void) | undefined;

  function sync(): void {
    onDisabled(input.matches(':disabled'));

    const nextRoot = input.getRootNode();
    if (root !== nextRoot) {
      root = nextRoot;
      releaseFocus?.();
      input.removeAttribute('data-unica-input-focus');
      releaseFocus = subscribeFocusOrigin(input, (origin) => {
        if (origin === null) {
          input.removeAttribute('data-unica-input-focus');
        } else {
          input.setAttribute('data-unica-input-focus', origin);
        }
      });
    }

    const nextPath: Node[] = [];
    for (
      let node: Node | null = input;
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

    const realm = getDefaultView(getOwnerDocument(input));
    if (!realm) {
      return;
    }
    observer = new realm.MutationObserver(sync);
    // Moving any ancestor or changing a fieldset's first legend can change :disabled.
    // Watch the path and direct children only, including moves between roots.
    for (const node of path) {
      if (node === input || (isElementNode(node) && getLocalName(node) === 'fieldset')) {
        observer.observe(node, {
          childList: true,
          attributes: true,
          attributeFilter: ['disabled'],
        });
      } else {
        observer.observe(node, { childList: true });
      }
    }
  }

  sync();
  return () => {
    observer?.disconnect();
    releaseFocus?.();
    input.removeAttribute('data-unica-input-focus');
  };
}

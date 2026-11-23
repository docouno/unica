import {
  addListenerSafe,
  getComposedParentElement,
  getDeepActiveElement,
  getLiveView,
  getLocalName,
  getNamespaceURI,
  getOwnerDocument,
  getRootNodeSafe,
  getShadowHostSafe,
  isContentEditableSafe,
  isElementNode,
  removeListenerSafe,
} from './dom.js';

export type FocusOrigin = 'unknown' | 'pointer' | 'keyboard';

type FocusOriginListener = (origin: FocusOrigin | null) => void;

interface FocusBinding {
  readonly notify: FocusOriginListener;
  reported: FocusOrigin | null;
  attached: boolean;
}

interface FocusTracker {
  subscribe: (element: Element, notify: FocusOriginListener) => () => void;
  retain: () => () => void;
  markKeyboard: () => void;
}

const trackers = /* @__PURE__ */ new WeakMap<Document, FocusTracker>();
const textInputTypes = /* @__PURE__ */ new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
]);
const navigationKeys = /* @__PURE__ */ new Set([
  'Tab',
  'Escape',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

function elementOf(target: EventTarget | null | undefined): Element | null {
  // An adopted element keeps its original realm even after changing documents.
  return isElementNode(target) ? target : null;
}

function isSingleCodePoint(key: string): boolean {
  return key.length === 1 || (key.length === 2 && (key.codePointAt(0) ?? 0) > 0xffff);
}

function composedContains(owner: Element, active: Element | null): boolean {
  for (let node: Element | null = active; node; node = getComposedParentElement(node)) {
    if (node === owner) {
      return true;
    }
  }
  return false;
}

function editsText(target: Element | null, key: string): boolean {
  if (
    !target ||
    getNamespaceURI(target) !== 'http://www.w3.org/1999/xhtml' ||
    key === 'Tab' ||
    key === 'Escape'
  ) {
    return false;
  }
  const name = getLocalName(target);
  if (name === 'input') {
    const { type } = target as HTMLInputElement;
    if (type === 'number' && (key === 'ArrowUp' || key === 'ArrowDown')) {
      return false;
    }
    return key !== 'Enter' && textInputTypes.has(type);
  }
  return name === 'textarea' || isContentEditableSafe(target);
}

function createTracker(doc: Document, view: Window): FocusTracker {
  const bindings = new Map<Element, Set<FocusBinding>>();
  const shadowRoots = new Map<Node, number>();
  let focused = new Set<FocusBinding>();
  let retained = 0;
  let origin: FocusOrigin = 'unknown';
  let pendingFocusCheck: number | undefined;

  function sync(target: Element | null): void {
    const affected = focused;
    focused = new Set<FocusBinding>();
    for (let owner: Element | null = target; owner; owner = getComposedParentElement(owner)) {
      const ownerBindings = bindings.get(owner);
      if (ownerBindings) {
        for (const binding of ownerBindings) {
          focused.add(binding);
          affected.add(binding);
        }
      }
    }
    let failure: { error: unknown } | undefined;
    for (const binding of affected) {
      const next = focused.has(binding) ? origin : null;
      if (binding.attached && binding.reported !== next) {
        binding.reported = next;
        try {
          binding.notify(next);
        } catch (error) {
          failure ??= { error };
        }
      }
    }
    if (failure) {
      const currentView = getLiveView(doc);
      if (typeof currentView?.reportError === 'function') {
        currentView.reportError(failure.error);
      } else if (typeof reportError === 'function') {
        reportError(failure.error);
      } else {
        throw failure.error;
      }
    }
  }

  function setOrigin(next: FocusOrigin): void {
    if (origin !== next) {
      origin = next;
      sync(getDeepActiveElement(doc));
    }
  }

  function pointer(): void {
    setOrigin('pointer');
  }

  function keyboard(event: Event): void {
    if (origin === 'keyboard') {
      return;
    }
    const keyEvent = event as KeyboardEvent;
    const { key } = keyEvent;
    if (
      typeof key !== 'string' ||
      keyEvent.isComposing ||
      keyEvent.keyCode === 229 ||
      keyEvent.altKey ||
      keyEvent.ctrlKey ||
      keyEvent.metaKey ||
      (!navigationKeys.has(key) && !isSingleCodePoint(key)) ||
      editsText(elementOf(keyEvent.composedPath()[0]), key)
    ) {
      return;
    }
    setOrigin('keyboard');
  }

  function cancelFocusCheck(): void {
    if (pendingFocusCheck !== undefined) {
      getLiveView(doc)?.clearTimeout(pendingFocusCheck);
      pendingFocusCheck = undefined;
    }
  }

  function syncActiveElement(): void {
    cancelFocusCheck();
    sync(getDeepActiveElement(doc));
  }

  function focusOut(event: Event): void {
    const focusEvent = event as FocusEvent;
    // A successful transfer reports focusin. If a handler removes the destination,
    // reconcile after native dispatch; a microtask can run between blur and focus.
    if (focusEvent.relatedTarget === null) {
      syncActiveElement();
    } else if (focused.size && pendingFocusCheck === undefined) {
      pendingFocusCheck = getLiveView(doc)?.setTimeout(syncActiveElement, 0);
    }
  }

  function blur(): void {
    // The next document entry can arrive without a local key event. A new pointerdown
    // can arrive before window focus, so clear the previous origin on exit instead.
    setOrigin('unknown');
  }

  addListenerSafe(doc, 'pointerdown', pointer, true);
  addListenerSafe(doc, 'keydown', keyboard, true);
  addListenerSafe(doc, 'focusin', syncActiveElement, true);
  addListenerSafe(doc, 'focusout', focusOut, true);
  addListenerSafe(view, 'blur', blur);

  function stopIfIdle(): void {
    if (bindings.size || retained) {
      return;
    }
    cancelFocusCheck();
    removeListenerSafe(doc, 'pointerdown', pointer, true);
    removeListenerSafe(doc, 'keydown', keyboard, true);
    removeListenerSafe(doc, 'focusin', syncActiveElement, true);
    removeListenerSafe(doc, 'focusout', focusOut, true);
    // A retained document can outlive an iframe navigation to a different origin.
    if (getLiveView(doc) === view) {
      removeListenerSafe(view, 'blur', blur);
    }
    trackers.delete(doc);
  }

  return {
    markKeyboard: () => setOrigin('keyboard'),
    retain() {
      retained++;
      let active = true;
      return () => {
        if (active) {
          active = false;
          retained--;
          stopIfIdle();
        }
      };
    },
    subscribe(element, notify) {
      let owners = bindings.get(element);
      if (!owners) {
        owners = new Set<FocusBinding>();
        bindings.set(element, owners);
      }
      const binding: FocusBinding = { notify, reported: null, attached: true };
      owners.add(binding);

      const root = getRootNodeSafe(element);
      // Focus transfers within the same ShadowRoot stop propagating focusin/focusout at
      // the shadow boundary (retargeted target === relatedTarget), so listen on the root too.
      const shadowRoot = root !== doc && getShadowHostSafe(root) ? root : null;
      if (shadowRoot) {
        const count = shadowRoots.get(shadowRoot) ?? 0;
        if (count === 0) {
          addListenerSafe(shadowRoot, 'focusin', syncActiveElement, true);
          addListenerSafe(shadowRoot, 'focusout', focusOut, true);
        }
        shadowRoots.set(shadowRoot, count + 1);
      }

      const detach = (): void => {
        if (!binding.attached) {
          return;
        }
        binding.attached = false;
        focused.delete(binding);
        owners.delete(binding);
        if (!owners.size) {
          bindings.delete(element);
        }
        if (shadowRoot) {
          const remaining = (shadowRoots.get(shadowRoot) ?? 1) - 1;
          if (remaining <= 0) {
            shadowRoots.delete(shadowRoot);
            removeListenerSafe(shadowRoot, 'focusin', syncActiveElement, true);
            removeListenerSafe(shadowRoot, 'focusout', focusOut, true);
          } else {
            shadowRoots.set(shadowRoot, remaining);
          }
        }
        stopIfIdle();
      };

      // Mounting a sibling during blur must not interrupt an existing focus transfer.
      if (composedContains(element, getDeepActiveElement(doc))) {
        focused.add(binding);
        binding.reported = origin;
        try {
          notify(origin);
        } catch (error) {
          detach();
          throw error;
        }
      }
      return detach;
    },
  };
}

function trackerFor(doc: Document | null): FocusTracker | undefined {
  const view = getLiveView(doc);
  if (!doc || !view) {
    return undefined;
  }
  let tracker = trackers.get(doc);
  if (!tracker) {
    tracker = createTracker(doc, view);
    trackers.set(doc, tracker);
  }
  return tracker;
}

/** Track modality before conditionally rendered focus owners mount. */
export function retainFocusOrigin(document: Document): () => void {
  return trackerFor(document)?.retain() ?? (() => {});
}

/** Subscribe to focus within an owner. Detach and subscribe again if the owner changes document. */
export function subscribeFocusOrigin(element: Element, notify: FocusOriginListener): () => void {
  return trackerFor(getOwnerDocument(element))?.subscribe(element, notify) ?? (() => {});
}

/** A composite can claim keyboard navigation while leaving DOM focus in its editor. */
export function markKeyboardNavigation(element: Element): void {
  const doc = getOwnerDocument(element);
  if (doc) {
    trackers.get(doc)?.markKeyboard();
  }
}

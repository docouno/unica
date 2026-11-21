import {
  addListenerSafe,
  containsSafe,
  getDefaultView,
  getDocumentActiveElement,
  getLocalName,
  getNamespaceURI,
  getOwnerDocument,
  getParentElement,
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
  return name === 'textarea' || (target as HTMLElement).isContentEditable;
}

function createTracker(doc: Document, view: Window): FocusTracker {
  const bindings = new Map<Element, Set<FocusBinding>>();
  let focused = new Set<FocusBinding>();
  let origin: FocusOrigin = 'unknown';
  let pendingFocusCheck: number | undefined;

  function sync(target: Element | null): void {
    const affected = focused;
    focused = new Set<FocusBinding>();
    for (let owner: Element | null = target; owner; owner = getParentElement(owner)) {
      for (const binding of bindings.get(owner) ?? []) {
        focused.add(binding);
        affected.add(binding);
      }
    }
    for (const binding of affected) {
      const next = focused.has(binding) ? origin : null;
      if (binding.attached && binding.reported !== next) {
        binding.reported = next;
        binding.notify(next);
      }
    }
  }

  function setOrigin(next: FocusOrigin): void {
    if (origin !== next) {
      origin = next;
      sync(getDocumentActiveElement(doc));
    }
  }

  function pointer(): void {
    setOrigin('pointer');
  }

  function keyboard(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    const { key } = keyEvent;
    if (
      keyEvent.isComposing ||
      keyEvent.altKey ||
      keyEvent.ctrlKey ||
      keyEvent.metaKey ||
      (!navigationKeys.has(key) && [...key].length !== 1) ||
      editsText(elementOf(keyEvent.composedPath()[0]), key)
    ) {
      return;
    }
    setOrigin('keyboard');
  }

  function cancelFocusCheck(): void {
    if (pendingFocusCheck !== undefined) {
      view.clearTimeout(pendingFocusCheck);
      pendingFocusCheck = undefined;
    }
  }

  function syncActiveElement(): void {
    cancelFocusCheck();
    sync(getDocumentActiveElement(doc));
  }

  function focusOut(event: Event): void {
    const focusEvent = event as FocusEvent;
    // A successful transfer reports focusin. If a handler removes the destination,
    // reconcile after native dispatch; a microtask can run between blur and focus.
    if (focusEvent.relatedTarget === null) {
      syncActiveElement();
    } else if (focused.size && pendingFocusCheck === undefined) {
      pendingFocusCheck = view.setTimeout(syncActiveElement, 0);
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

  return {
    markKeyboard: () => setOrigin('keyboard'),
    subscribe(element, notify) {
      let owners = bindings.get(element);
      if (!owners) {
        owners = new Set<FocusBinding>();
        bindings.set(element, owners);
      }
      const binding: FocusBinding = { notify, reported: null, attached: true };
      owners.add(binding);

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
        if (!bindings.size) {
          cancelFocusCheck();
          removeListenerSafe(doc, 'pointerdown', pointer, true);
          removeListenerSafe(doc, 'keydown', keyboard, true);
          removeListenerSafe(doc, 'focusin', syncActiveElement, true);
          removeListenerSafe(doc, 'focusout', focusOut, true);
          removeListenerSafe(view, 'blur', blur);
          trackers.delete(doc);
        }
      };

      // Mounting a sibling during blur must not interrupt an existing focus transfer.
      if (containsSafe(element, getDocumentActiveElement(doc))) {
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

/** Subscribe to focus within an owner. Detach and subscribe again if the owner changes document. */
export function subscribeFocusOrigin(element: Element, notify: FocusOriginListener): () => void {
  const doc = getOwnerDocument(element);
  const view = getDefaultView(doc);
  if (!doc || !view) {
    return () => {};
  }
  let tracker = trackers.get(doc);
  if (!tracker) {
    tracker = createTracker(doc, view);
    trackers.set(doc, tracker);
  }
  return tracker.subscribe(element, notify);
}

/** A composite can claim keyboard navigation while leaving DOM focus in its editor. */
export function markKeyboardNavigation(element: Element): void {
  const doc = getOwnerDocument(element);
  if (doc) {
    trackers.get(doc)?.markKeyboard();
  }
}

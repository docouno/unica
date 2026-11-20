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

const trackers = new WeakMap<Document, FocusTracker>();
const textInputTypes = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);
const navigationKeys = new Set([
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
  return target && 'nodeType' in target && target.nodeType === 1 ? (target as Element) : null;
}

function editsText(target: Element | null, key: string): boolean {
  if (
    target?.namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
    key === 'Tab' ||
    key === 'Escape'
  ) {
    return false;
  }
  if (target.localName === 'input') {
    const { type } = target as HTMLInputElement;
    if (type === 'number' && (key === 'ArrowUp' || key === 'ArrowDown')) {
      return false;
    }
    return key !== 'Enter' && textInputTypes.has(type);
  }
  return target.localName === 'textarea' || (target as HTMLElement).isContentEditable;
}

function createTracker(doc: Document, view: Window): FocusTracker {
  const bindings = new Map<Element, Set<FocusBinding>>();
  let focused = new Set<FocusBinding>();
  let origin: FocusOrigin = 'unknown';

  function sync(target: Element | null): void {
    const affected = focused;
    focused = new Set<FocusBinding>();
    for (let owner = target; owner; owner = owner.parentElement) {
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
      sync(doc.activeElement);
    }
  }

  function pointer(): void {
    setOrigin('pointer');
  }

  function keyboard(event: KeyboardEvent): void {
    const { key } = event;
    if (
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (!navigationKeys.has(key) && [...key].length !== 1) ||
      editsText(elementOf(event.composedPath()[0]), key)
    ) {
      return;
    }
    setOrigin('keyboard');
  }

  function focusIn(event: FocusEvent): void {
    sync(elementOf(event.target));
  }

  function focusOut(event: FocusEvent): void {
    sync(elementOf(event.relatedTarget));
  }

  function blur(): void {
    // The next document entry can arrive without a local key event. A new pointerdown
    // can arrive before window focus, so clear the previous origin on exit instead.
    setOrigin('unknown');
  }

  doc.addEventListener('pointerdown', pointer, true);
  doc.addEventListener('keydown', keyboard, true);
  doc.addEventListener('focusin', focusIn, true);
  doc.addEventListener('focusout', focusOut, true);
  view.addEventListener('blur', blur);

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
      sync(doc.activeElement);

      return () => {
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
          doc.removeEventListener('pointerdown', pointer, true);
          doc.removeEventListener('keydown', keyboard, true);
          doc.removeEventListener('focusin', focusIn, true);
          doc.removeEventListener('focusout', focusOut, true);
          view.removeEventListener('blur', blur);
          trackers.delete(doc);
        }
      };
    },
  };
}

/** Subscribe to focus within an owner. Detach and subscribe again if the owner changes document. */
export function subscribeFocusOrigin(element: Element, notify: FocusOriginListener): () => void {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (!view) {
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
  trackers.get(element.ownerDocument)?.markKeyboard();
}

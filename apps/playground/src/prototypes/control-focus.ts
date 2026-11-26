import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface FocusTracker {
  users: number;
  sync: (target: EventTarget | null) => void;
  dispose: () => void;
}

const trackers = new WeakMap<Document, FocusTracker>();

// A local preview mechanism, not the library's eventual focus-management API.
function trackFocus(doc: Document): FocusTracker {
  const ElementConstructor = doc.defaultView?.Element;
  let origin: 'keyboard' | 'pointer' = 'keyboard';
  const sync = (target: EventTarget | null): void => {
    if (!ElementConstructor || !(target instanceof ElementConstructor)) {
      return;
    }
    const shell = target.closest<HTMLElement>('[data-preview-focus-scope]');
    if (shell) {
      shell.dataset.focusOrigin = origin;
    }
  };
  const pointer = (): void => {
    origin = 'pointer';
    sync(doc.activeElement);
  };
  const keyboard = (event: KeyboardEvent): void => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
      return;
    }
    const editing =
      ElementConstructor &&
      event.target instanceof ElementConstructor &&
      event.target.matches('input, textarea, [contenteditable="true"]');
    // Typing and moving the caret after a click keep the quiet editing treatment.
    if (editing && event.key !== 'Tab' && event.key !== 'Escape') {
      return;
    }
    origin = 'keyboard';
    sync(doc.activeElement);
  };
  const focus = (event: FocusEvent): void => sync(event.target);
  doc.addEventListener('pointerdown', pointer, true);
  doc.addEventListener('keydown', keyboard, true);
  doc.addEventListener('focusin', focus, true);
  return {
    users: 0,
    sync,
    dispose: () => {
      doc.removeEventListener('pointerdown', pointer, true);
      doc.removeEventListener('keydown', keyboard, true);
      doc.removeEventListener('focusin', focus, true);
    },
  };
}

export function useControlFocus(): RefObject<HTMLSpanElement | null> {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const shell = ref.current;
    if (!shell) {
      return;
    }
    const doc = shell.ownerDocument;
    let tracker = trackers.get(doc);
    if (!tracker) {
      tracker = trackFocus(doc);
      trackers.set(doc, tracker);
    }
    tracker.users += 1;
    if (shell.contains(doc.activeElement)) {
      tracker.sync(doc.activeElement);
    }
    return () => {
      tracker.users -= 1;
      if (tracker.users === 0) {
        tracker.dispose();
        trackers.delete(doc);
      }
    };
  }, []);
  return ref;
}

import {
  addListenerSafe,
  getLiveView,
  getLocalName,
  getOwnerDocument,
  isConnectedNode,
  isElementNode,
  removeListenerSafe,
  reportErrorSafe,
} from './dom.js';

export interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

export interface PointerProximityObserver {
  /** Read geometry now. Return an optional write to run after the other measurements. */
  readonly measure: (position: PointerPosition) => (() => void) | void;
  readonly reset: () => void;
}

export interface PointerProximitySubscription {
  /** Enable work only while the component has a material response to render. */
  readonly setEnabled: (enabled: boolean) => void;
  /** Recalculate from the last position after a local geometry change. */
  readonly refresh: () => void;
  readonly unsubscribe: () => void;
}

interface PointerBinding {
  readonly element: Element;
  readonly observer: PointerProximityObserver;
  sampled: boolean;
}

interface PointerSampler {
  subscribe: (
    element: Element,
    observer: PointerProximityObserver,
    enabled: boolean,
  ) => PointerProximitySubscription;
}

const samplers = new WeakMap<Document, PointerSampler>();
const inactive: PointerProximitySubscription = {
  setEnabled() {},
  refresh() {},
  unsubscribe() {},
};

function isFrame(target: EventTarget | null): boolean {
  return isElementNode(target) && getLocalName(target) === 'iframe';
}

function createSampler(doc: Document, view: Window & typeof globalThis): PointerSampler {
  const bindings = new Set<PointerBinding>();
  const enabledBindings = new Set<PointerBinding>();
  const hover = view.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = view.matchMedia('(forced-colors: active)');
  const media = [hover, reducedMotion, forcedColors];
  let position: PointerPosition | null = null;
  let frame: number | null = null;

  function schedule(): void {
    if (position && enabledBindings.size && frame === null) {
      frame = view.requestAnimationFrame(deliver);
    }
  }

  function cancelFrame(): void {
    if (frame !== null) {
      view.cancelAnimationFrame(frame);
      frame = null;
    }
  }

  function reset(binding: PointerBinding): void {
    if (binding.sampled) {
      binding.sampled = false;
      try {
        binding.observer.reset();
      } catch (error) {
        reportErrorSafe(view, error);
      }
    }
  }

  function clearPosition(): void {
    if (!position) {
      return;
    }
    position = null;
    cancelFrame();
    for (const binding of [...enabledBindings]) {
      reset(binding);
    }
  }

  function deliver(): void {
    frame = null;
    const sample = position;
    if (!sample) {
      return;
    }
    const writes: { binding: PointerBinding; write: () => void }[] = [];
    for (const binding of [...enabledBindings]) {
      if (
        !enabledBindings.has(binding) ||
        !isConnectedNode(binding.element) ||
        getOwnerDocument(binding.element) !== doc
      ) {
        continue;
      }
      binding.sampled = true;
      try {
        const write = binding.observer.measure(sample);
        if (write) {
          writes.push({ binding, write });
        }
      } catch (error) {
        reportErrorSafe(view, error);
      }
    }
    for (const { binding, write } of writes) {
      if (position === sample && enabledBindings.has(binding) && binding.sampled) {
        try {
          write();
        } catch (error) {
          reportErrorSafe(view, error);
        }
      }
    }
  }

  function pointer(event: PointerEvent): void {
    if (event.pointerType === 'touch' || isFrame(event.target)) {
      clearPosition();
      return;
    }
    if (doc.hidden || !hover.matches || reducedMotion.matches || forcedColors.matches) {
      return;
    }
    position = { x: event.clientX, y: event.clientY };
    schedule();
  }

  function pointerOver(event: PointerEvent): void {
    // Entering an iframe can report a boundary event on the iframe without a
    // pointerout or pointerleave on the parent document.
    if (isFrame(event.target)) {
      clearPosition();
    }
  }

  function pointerOut(event: PointerEvent): void {
    if (event.relatedTarget === null) {
      clearPosition();
    }
  }

  function visibility(): void {
    if (doc.hidden) {
      clearPosition();
    }
  }

  addListenerSafe(doc, 'pointermove', pointer, { capture: true, passive: true });
  addListenerSafe(doc, 'pointerdown', pointer, { capture: true, passive: true });
  addListenerSafe(doc, 'pointerleave', clearPosition);
  addListenerSafe(doc, 'pointerover', pointerOver, true);
  addListenerSafe(doc, 'pointerout', pointerOut, true);
  addListenerSafe(doc, 'pointercancel', clearPosition, true);
  addListenerSafe(doc, 'visibilitychange', visibility);
  addListenerSafe(doc, 'scroll', schedule, { capture: true, passive: true });
  addListenerSafe(view, 'resize', schedule);
  addListenerSafe(view, 'blur', clearPosition);
  for (const query of media) {
    addListenerSafe(query, 'change', clearPosition);
  }

  function dispose(): void {
    removeListenerSafe(doc, 'pointermove', pointer, true);
    removeListenerSafe(doc, 'pointerdown', pointer, true);
    removeListenerSafe(doc, 'pointerleave', clearPosition);
    removeListenerSafe(doc, 'pointerover', pointerOver, true);
    removeListenerSafe(doc, 'pointerout', pointerOut, true);
    removeListenerSafe(doc, 'pointercancel', clearPosition, true);
    removeListenerSafe(doc, 'visibilitychange', visibility);
    removeListenerSafe(doc, 'scroll', schedule, true);
    removeListenerSafe(view, 'resize', schedule);
    removeListenerSafe(view, 'blur', clearPosition);
    for (const query of media) {
      removeListenerSafe(query, 'change', clearPosition);
    }
    samplers.delete(doc);
  }

  return {
    subscribe(element, observer, enabled) {
      const binding: PointerBinding = { element, observer, sampled: false };
      bindings.add(binding);

      function setEnabled(next: boolean): void {
        if (!bindings.has(binding)) {
          return;
        }
        if (next && !enabledBindings.has(binding)) {
          enabledBindings.add(binding);
          schedule();
        } else if (!next && enabledBindings.delete(binding)) {
          if (!enabledBindings.size) {
            cancelFrame();
          }
          reset(binding);
        }
      }

      setEnabled(enabled);
      return {
        setEnabled,
        refresh: () => {
          if (enabledBindings.has(binding)) {
            schedule();
          }
        },
        unsubscribe: () => {
          if (!bindings.delete(binding)) {
            return;
          }
          enabledBindings.delete(binding);
          if (!enabledBindings.size) {
            cancelFrame();
          }
          if (!bindings.size) {
            dispose();
          }
          reset(binding);
        },
      };
    },
  };
}

/** Subscribe in the owner's current document. Unsubscribe and rebind if it moves documents. */
export function subscribePointerProximity(
  element: Element,
  observer: PointerProximityObserver,
  enabled = true,
): PointerProximitySubscription {
  const doc = getOwnerDocument(element);
  const view = getLiveView(doc);
  if (
    !doc ||
    !view ||
    typeof view.matchMedia !== 'function' ||
    typeof view.requestAnimationFrame !== 'function' ||
    typeof view.cancelAnimationFrame !== 'function'
  ) {
    return inactive;
  }
  let sampler = samplers.get(doc);
  if (!sampler) {
    sampler = createSampler(doc, view);
    samplers.set(doc, sampler);
  }
  return sampler.subscribe(element, observer, enabled);
}

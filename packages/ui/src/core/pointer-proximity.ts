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
  return !!target && 'localName' in target && target.localName === 'iframe';
}

function createSampler(doc: Document, view: Window): PointerSampler {
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
      binding.observer.reset();
    }
  }

  function clearPosition(): void {
    if (!position) {
      return;
    }
    position = null;
    cancelFrame();
    for (const binding of enabledBindings) {
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
    for (const binding of enabledBindings) {
      if (!binding.element.isConnected || binding.element.ownerDocument !== doc) {
        continue;
      }
      binding.sampled = true;
      const write = binding.observer.measure(sample);
      if (write) {
        writes.push({ binding, write });
      }
    }
    for (const { binding, write } of writes) {
      if (position === sample && enabledBindings.has(binding) && binding.sampled) {
        write();
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

  doc.addEventListener('pointermove', pointer, { capture: true, passive: true });
  doc.addEventListener('pointerdown', pointer, { capture: true, passive: true });
  doc.addEventListener('pointerleave', clearPosition);
  doc.addEventListener('pointerover', pointerOver, true);
  doc.addEventListener('pointerout', pointerOut, true);
  doc.addEventListener('pointercancel', clearPosition, true);
  doc.addEventListener('visibilitychange', visibility);
  doc.addEventListener('scroll', schedule, { capture: true, passive: true });
  view.addEventListener('resize', schedule);
  view.addEventListener('blur', clearPosition);
  for (const query of media) {
    query.addEventListener('change', clearPosition);
  }

  function dispose(): void {
    doc.removeEventListener('pointermove', pointer, true);
    doc.removeEventListener('pointerdown', pointer, true);
    doc.removeEventListener('pointerleave', clearPosition);
    doc.removeEventListener('pointerover', pointerOver, true);
    doc.removeEventListener('pointerout', pointerOut, true);
    doc.removeEventListener('pointercancel', clearPosition, true);
    doc.removeEventListener('visibilitychange', visibility);
    doc.removeEventListener('scroll', schedule, true);
    view.removeEventListener('resize', schedule);
    view.removeEventListener('blur', clearPosition);
    for (const query of media) {
      query.removeEventListener('change', clearPosition);
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
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (
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

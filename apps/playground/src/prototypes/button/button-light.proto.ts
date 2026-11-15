// Prototype-only input sampling. The library service and provider API are separate work.
interface LightBinding {
  reach: number;
  visible: boolean;
  paint: string | null;
  ownedStyle: string | null;
}

interface PointerField {
  add: (element: HTMLButtonElement) => () => void;
}

const fields = new WeakMap<Document, PointerField>();
const lightProperties = [
  '--button-light-x',
  '--button-light-y',
  '--button-light-strength',
] as const;

function createField(doc: Document, view: Window): PointerField {
  const targets = new Map<HTMLButtonElement, LightBinding>();
  const hover = view.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const forced = view.matchMedia('(forced-colors: active)');
  let point: { x: number; y: number } | null = null;
  let frame = 0;
  let dirty = true;
  let awake = false;

  function schedule(refresh = false): void {
    dirty ||= refresh;
    frame ||= view.requestAnimationFrame(draw);
  }

  function clearPointer(): void {
    point = null;
    schedule();
  }

  function paint(
    element: HTMLButtonElement,
    binding: LightBinding,
    sample: { x: number; y: number; strength: number } | null,
  ): void {
    const key = sample
      ? `${sample.x.toFixed(2)}/${sample.y.toFixed(2)}/${sample.strength.toFixed(3)}`
      : '';
    if (binding.paint === key) {
      return;
    }
    binding.paint = key;
    if (sample) {
      element.dataset.pointerLight = 'true';
      element.style.setProperty(lightProperties[0], `${sample.x.toFixed(2)}px`);
      element.style.setProperty(lightProperties[1], `${sample.y.toFixed(2)}px`);
      element.style.setProperty(lightProperties[2], sample.strength.toFixed(3));
    } else {
      delete element.dataset.pointerLight;
      // Keep the outgoing position while CSS fades the light to zero.
      element.style.removeProperty(lightProperties[2]);
    }
    binding.ownedStyle = element.getAttribute('style');
  }

  function draw(): void {
    frame = 0;
    if (dirty) {
      for (const [element, binding] of targets) {
        const style = view.getComputedStyle(element);
        const reach = style.getPropertyValue('--btn-primary-backlight-reach').trim();
        binding.reach = /^\d+(?:\.\d+)?px$/.test(reach) ? Number.parseFloat(reach) : 0;
        binding.visible = style.visibility === 'visible';
      }
      dirty = false;
    }
    const enabled = hover.matches && !reduced.matches && !forced.matches;
    awake = enabled && [...targets.values()].some((binding) => binding.reach > 0);

    // Read the whole batch before writing light styles. No continuous animation loop.
    const samples = [...targets].map(([element, binding]) => {
      if (
        !awake ||
        !point ||
        !binding.visible ||
        binding.reach <= 0 ||
        !element.isConnected ||
        element.matches(':disabled, [data-loading], [aria-pressed="true"]') ||
        element.closest('[inert]')
      ) {
        return { element, binding, sample: null };
      }

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return { element, binding, sample: null };
      }
      // The workbench scales artboards. The recipe needs local, unscaled CSS pixels.
      const sx = rect.width / element.offsetWidth;
      const sy = rect.height / element.offsetHeight;
      const dx = Math.max(rect.left - point.x, point.x - rect.right, 0) / sx;
      const dy = Math.max(rect.top - point.y, point.y - rect.bottom, 0) / sy;
      const strength = Math.max(0, 1 - Math.hypot(dx, dy) / binding.reach);
      if (!strength) {
        return { element, binding, sample: null };
      }

      // A representative face point avoids mistaking transparent rounded corners for cover.
      const hit = doc.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (!hit || !element.contains(hit)) {
        return { element, binding, sample: null };
      }
      return {
        element,
        binding,
        sample: { x: (point.x - rect.left) / sx, y: (point.y - rect.top) / sy, strength },
      };
    });
    for (const { element, binding, sample } of samples) {
      paint(element, binding, sample);
    }
  }

  function pointer(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      clearPointer();
      return;
    }
    point = { x: event.clientX, y: event.clientY };
    // Range-zero themes retain only the cheap shared sample, with no pointer frames.
    if (awake) {
      schedule();
    }
  }

  function refresh(): void {
    schedule(true);
  }
  function geometry(): void {
    if (awake) {
      schedule();
    }
  }
  function visibility(): void {
    if (doc.hidden) {
      clearPointer();
    }
  }

  const observer = new MutationObserver((records) => {
    const changed = records.some((record) => {
      const binding = targets.get(record.target as HTMLButtonElement);
      if (record.type !== 'attributes' || !binding) {
        return true;
      }
      if (record.attributeName === 'data-pointer-light') {
        return false;
      }
      return (
        record.attributeName !== 'style' ||
        (record.target as Element).getAttribute('style') !== binding.ownedStyle
      );
    });
    if (changed) {
      refresh();
    }
  });
  observer.observe(doc, { subtree: true, childList: true, attributes: true });
  const resize = new ResizeObserver(refresh);
  doc.addEventListener('pointermove', pointer, { passive: true });
  doc.addEventListener('pointerdown', pointer, { passive: true });
  doc.addEventListener('pointerleave', clearPointer);
  doc.addEventListener('pointercancel', clearPointer);
  doc.addEventListener('visibilitychange', visibility);
  doc.addEventListener('scroll', geometry, true);
  view.addEventListener('resize', refresh);
  view.addEventListener('blur', clearPointer);
  for (const media of [hover, reduced, forced]) {
    media.addEventListener('change', refresh);
  }

  return {
    add(element) {
      const binding: LightBinding = { reach: 0, visible: true, paint: null, ownedStyle: null };
      targets.set(element, binding);
      resize.observe(element);
      refresh();
      return () => {
        paint(element, binding, null);
        // Always clear coordinates on detach, including after an already-started fade.
        for (const property of lightProperties) {
          element.style.removeProperty(property);
        }
        binding.ownedStyle = element.getAttribute('style');
        targets.delete(element);
        resize.unobserve(element);
        if (targets.size) {
          return;
        }
        observer.disconnect();
        resize.disconnect();
        doc.removeEventListener('pointermove', pointer);
        doc.removeEventListener('pointerdown', pointer);
        doc.removeEventListener('pointerleave', clearPointer);
        doc.removeEventListener('pointercancel', clearPointer);
        doc.removeEventListener('visibilitychange', visibility);
        doc.removeEventListener('scroll', geometry, true);
        view.removeEventListener('resize', refresh);
        view.removeEventListener('blur', clearPointer);
        for (const media of [hover, reduced, forced]) {
          media.removeEventListener('change', refresh);
        }
        view.cancelAnimationFrame(frame);
        fields.delete(doc);
      };
    },
  };
}

export function bindButtonPointerLight(element: HTMLButtonElement): () => void {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (!view || typeof view.matchMedia !== 'function') {
    return () => {};
  }
  let field = fields.get(doc);
  if (!field) {
    field = createField(doc, view);
    fields.set(doc, field);
  }
  return field.add(element);
}

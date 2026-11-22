import { addListenerSafe, removeListenerSafe } from '../dom.js';

export type PreviewFamily = 'tooltip' | 'hover-card';

export interface PreviewOwner {
  readonly family: PreviewFamily;
  readonly domain: object | null;
  readonly replace: () => void;
  readonly pointerDown: (event: PointerEvent) => void;
  readonly pointerEnd: (event: PointerEvent) => void;
  readonly selectionChanged: () => void;
  readonly tab: (event: KeyboardEvent) => void;
}

interface PreviewRegistry {
  readonly protocol: 1;
  readonly retain: () => () => void;
  readonly intent: (cancel?: () => void) => number;
  readonly invalidate: () => void;
  readonly isCurrent: (generation: number) => boolean;
  readonly completeIntent: (generation: number) => void;
  readonly isWarm: (owner: PreviewOwner) => boolean;
  readonly canAdmit: (generation: number, controlled: boolean) => boolean;
  readonly admit: (owner: PreviewOwner, generation: number) => void;
  readonly release: (owner: PreviewOwner) => void;
}

const registryKey = Symbol.for('@docouno/unica/HoverPreviewRegistry@1');
const fallbackRegistries = new WeakMap<Document, PreviewRegistry>();
const COOLDOWN = 300;

function isRegistry(value: unknown): value is PreviewRegistry {
  return (
    typeof value === 'object' &&
    value !== null &&
    Reflect.get(value, 'protocol') === 1 &&
    [
      'retain',
      'intent',
      'invalidate',
      'isCurrent',
      'completeIntent',
      'isWarm',
      'canAdmit',
      'admit',
      'release',
    ].every((key) => typeof Reflect.get(value, key) === 'function')
  );
}

function getRegistry(document: Document): PreviewRegistry | undefined {
  try {
    const value: unknown = Reflect.get(document, registryKey);
    if (isRegistry(value)) {
      return value;
    }
  } catch {
    // A restricted document can still keep a local registry.
  }
  return fallbackRegistries.get(document);
}

function createRegistry(document: Document, now: () => number): PreviewRegistry {
  let count = 0;
  let active: PreviewOwner | undefined;
  let generation = 0;
  let dismissedThrough = 0;
  let lastAdmitted = 0;
  let cancelPending: (() => void) | undefined;
  const defaultDomain = {};
  const cooldowns = new WeakMap<object, Partial<Record<PreviewFamily, number>>>();

  function markClosed(owner: PreviewOwner): void {
    const domain = owner.domain ?? defaultDomain;
    const cooldown = cooldowns.get(domain) ?? {};
    cooldown[owner.family] = now();
    cooldowns.set(domain, cooldown);
  }

  const pointerDown = (event: Event): void => {
    registry.invalidate();
    active?.pointerDown(event as PointerEvent);
  };
  const pointerEnd = (event: Event): void => active?.pointerEnd(event as PointerEvent);
  const selectionChanged = (): void => active?.selectionChanged();
  const keyDown = (event: Event): void => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.defaultPrevented || keyboard.isComposing) {
      return;
    }
    if (keyboard.key === 'Escape' || keyboard.key === 'Tab') {
      registry.invalidate();
    }
    if (keyboard.key === 'Tab') {
      active?.tab(keyboard);
    }
  };
  addListenerSafe(document, 'pointerdown', pointerDown, true);
  addListenerSafe(document, 'pointerup', pointerEnd, true);
  addListenerSafe(document, 'pointercancel', pointerEnd, true);
  addListenerSafe(document, 'selectionchange', selectionChanged);
  addListenerSafe(document, 'keydown', keyDown);

  const registry: PreviewRegistry = {
    protocol: 1,
    retain() {
      count++;
      return () => {
        if (--count !== 0) {
          return;
        }
        registry.intent();
        removeListenerSafe(document, 'pointerdown', pointerDown, true);
        removeListenerSafe(document, 'pointerup', pointerEnd, true);
        removeListenerSafe(document, 'pointercancel', pointerEnd, true);
        removeListenerSafe(document, 'selectionchange', selectionChanged);
        removeListenerSafe(document, 'keydown', keyDown);
        if (fallbackRegistries.get(document) === registry) {
          fallbackRegistries.delete(document);
        }
        try {
          if (Reflect.get(document, registryKey) === registry) {
            Reflect.deleteProperty(document, registryKey);
          }
        } catch {
          // Ignore restricted document proxies on teardown.
        }
      };
    },
    intent(cancel) {
      const previous = cancelPending;
      cancelPending = cancel;
      generation++;
      previous?.();
      return generation;
    },
    invalidate() {
      dismissedThrough = registry.intent();
    },
    isCurrent: (candidate) => generation === candidate,
    completeIntent(candidate) {
      if (generation === candidate) {
        cancelPending = undefined;
      }
    },
    isWarm(owner) {
      if (active?.family === owner.family && active.domain === owner.domain) {
        return true;
      }
      const lastClose = cooldowns.get(owner.domain ?? defaultDomain)?.[owner.family];
      return lastClose !== undefined && now() - lastClose < COOLDOWN;
    },
    canAdmit: (candidate, controlled) =>
      candidate > lastAdmitted && (controlled || candidate > dismissedThrough),
    admit(owner, candidate) {
      lastAdmitted = candidate;
      if (active === owner) {
        return;
      }
      const previous = active;
      active = owner;
      if (previous) {
        markClosed(previous);
        previous.replace();
      }
    },
    release(owner) {
      if (active === owner) {
        markClosed(owner);
        active = undefined;
      }
    },
  };

  let stored = false;
  try {
    if (Reflect.get(document, registryKey) === undefined) {
      stored = Reflect.set(document, registryKey, registry);
    }
  } catch {
    // Restricted documents use the module-local fallback.
  }
  if (!stored) {
    fallbackRegistries.set(document, registry);
  }
  return registry;
}

export function retainPreviewRegistry(
  document: Document,
  now: () => number,
): { registry: PreviewRegistry; release: () => void } {
  const registry = getRegistry(document) ?? createRegistry(document, now);
  return { registry, release: registry.retain() };
}

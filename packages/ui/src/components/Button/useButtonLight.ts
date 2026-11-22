import { useCallback, useRef } from 'react';
import {
  addListenerSafe,
  composedAncestors,
  getAttributeSafe,
  getComputedStyleSafe,
  getLiveView,
  getLocalName,
  getOwnerDocument,
  getRootNodeSafe,
  getShadowHostSafe,
  getShadowRootSafe,
  isConnectedNode,
  isElementNode,
  isInertElement,
  matchesSafe,
  removeAttributeSafe,
  removeListenerSafe,
  setAttributeSafe,
} from '../../core/dom.js';
import { createFrameJob } from '../../core/frame-scheduler.js';
import { subscribePointerProximity } from '../../core/pointer-proximity.js';
import type { PointerProximitySubscription } from '../../core/pointer-proximity.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { measureButtonLight } from './button-light-geometry.js';
import type { LightSample } from './button-light-geometry.js';

type LightRoot = Document | ShadowRoot;
type LightPaint = LightSample | 'blocked' | null;

interface LightBinding {
  readonly element: HTMLElement;
  readonly update: () => void;
  readonly pause: () => void;
  readonly usesLightMaterial: () => boolean;
  readonly measureDemand: () => () => void;
  readonly refresh: () => void;
  readonly clearKeyboardHold: () => void;
  readonly ownsMutation: (attribute: string | null) => boolean;
  readonly dispose: () => void;
}

interface LightEnvironment {
  readonly add: (binding: LightBinding) => void;
  readonly remove: (binding: LightBinding) => void;
  readonly watchTopLayer: () => void;
}

const lightX = '--_button-light-x';
const lightY = '--_button-light-y';
const lightStrength = '--_button-light-strength';
const blockedAttribute = 'data-unica-button-light-blocked';
const candidateSelector = '[data-unica-button-variant="primary"][data-unica-button-tone="accent"]';
const unavailableSelector =
  '[data-unica-button-disabled], [data-unica-button-loading], [aria-pressed="true"]';
const environments = new WeakMap<Document, LightEnvironment>();

function* shadowRootsOf(element: HTMLElement): Iterable<ShadowRoot> {
  let previous: Node | undefined;
  for (const ancestor of composedAncestors(element)) {
    const root = getRootNodeSafe(ancestor);
    if (previous !== root && getShadowHostSafe(root)) {
      yield root as ShadowRoot;
    }
    previous = root;
  }
}

function createEnvironment(doc: Document, view: Window & typeof globalThis): LightEnvironment {
  const bindings = new Map<EventTarget, LightBinding>();
  const observedRoots = new Map<LightRoot, MutationObserver>();
  const topLayerRoots = new Set<ShadowRoot>();
  const addedBranches = new Set<Element>();
  let watchingTopLayer = false;
  const rootEvents = ['toggle', 'close', 'slotchange', 'transitionend', 'animationend'] as const;
  const job = createFrameJob(doc, {
    measure() {
      const writes = [...bindings.values()].map((binding) => binding.measureDemand());
      return () => {
        for (const write of writes) {
          write();
        }
        reconcileRoots();
      };
    },
  });
  const invalidate = job.schedule;
  const resize =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(invalidate) : null;

  function onMutations(records: readonly MutationRecord[]): void {
    let changed = false;
    for (const { target, attributeName, addedNodes } of records) {
      changed ||= !bindings.get(target)?.ownsMutation(attributeName);
      if (watchingTopLayer) {
        for (const node of addedNodes) {
          if (isElementNode(node)) {
            addedBranches.add(node);
          }
        }
      }
    }
    if (changed) {
      invalidate();
    }
  }

  function observe(root: LightRoot): void {
    const observer = new view.MutationObserver(onMutations);
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    observedRoots.set(root, observer);
    // Native top-layer changes can repaint without mutating the DOM. Neither
    // toggle nor scroll has to cross a shadow boundary.
    for (const type of rootEvents) {
      addListenerSafe(root, type, invalidate, true);
    }
    if (root !== doc) {
      addListenerSafe(root, 'scroll', refreshSamples, { capture: true, passive: true });
    }
  }

  function unobserve(root: LightRoot, observer: MutationObserver): void {
    observer.disconnect();
    observedRoots.delete(root);
    for (const type of rootEvents) {
      removeListenerSafe(root, type, invalidate, true);
    }
    if (root !== doc) {
      removeListenerSafe(root, 'scroll', refreshSamples, true);
    }
  }

  function discoverOpenRoots(scope: LightRoot | Element): void {
    const elements = view.Document.prototype.createTreeWalker.call(
      doc,
      scope,
      view.NodeFilter.SHOW_ELEMENT,
    );
    let node: Node | null = isElementNode(scope) ? scope : elements.nextNode();
    while (node) {
      const root = getShadowRootSafe(node as Element);
      if (root && !topLayerRoots.has(root)) {
        topLayerRoots.add(root);
        if (!observedRoots.has(root)) {
          observe(root);
        }
        discoverOpenRoots(root);
      }
      node = elements.nextNode();
    }
  }

  function reconcileTopLayerRoots(): void {
    if (![...bindings.values()].some((binding) => binding.usesLightMaterial())) {
      watchingTopLayer = false;
      topLayerRoots.clear();
    } else if (watchingTopLayer) {
      for (const node of addedBranches) {
        if (isConnectedNode(node) && getOwnerDocument(node) === doc) {
          discoverOpenRoots(node);
        }
      }
      for (const root of topLayerRoots) {
        const host = getShadowHostSafe(root);
        if (!host || !isConnectedNode(host) || getOwnerDocument(host) !== doc) {
          topLayerRoots.delete(root);
        }
      }
    }
    addedBranches.clear();
  }

  function reconcileRoots(): void {
    if (!bindings.size) {
      return;
    }
    reconcileTopLayerRoots();
    const roots = new Set<LightRoot>([doc, ...topLayerRoots]);
    for (const { element } of bindings.values()) {
      for (const root of shadowRootsOf(element)) {
        roots.add(root);
      }
    }
    for (const root of roots) {
      if (!observedRoots.has(root)) {
        observe(root);
      }
    }
    for (const [root, observer] of observedRoots) {
      if (!roots.has(root)) {
        unobserve(root, observer);
      }
    }
  }

  function refreshSamples(): void {
    for (const binding of bindings.values()) {
      binding.refresh();
    }
  }

  function onBlur(): void {
    for (const binding of bindings.values()) {
      binding.clearKeyboardHold();
    }
  }

  observe(doc);
  addListenerSafe(doc, 'pointerup', refreshSamples, true);
  addListenerSafe(view, 'resize', invalidate);
  addListenerSafe(view, 'blur', onBlur);

  return {
    add(binding) {
      bindings.set(binding.element, binding);
      resize?.observe(binding.element);
      for (const root of shadowRootsOf(binding.element)) {
        if (!observedRoots.has(root)) {
          observe(root);
        }
      }
      invalidate();
    },
    remove(binding) {
      bindings.delete(binding.element);
      resize?.unobserve(binding.element);
      if (bindings.size) {
        invalidate();
        return;
      }
      job.dispose();
      resize?.disconnect();
      for (const [root, observer] of observedRoots) {
        unobserve(root, observer);
      }
      removeListenerSafe(doc, 'pointerup', refreshSamples, true);
      removeListenerSafe(view, 'resize', invalidate);
      removeListenerSafe(view, 'blur', onBlur);
      environments.delete(doc);
    },
    watchTopLayer() {
      if (!watchingTopLayer) {
        watchingTopLayer = true;
        // A sibling open shadow tree can cover an action without dispatching
        // toggle on the document. Scan once on material demand, then inspect
        // only inserted branches while this session can render light.
        discoverOpenRoots(doc);
      }
    },
  };
}

function getEnvironment(doc: Document): LightEnvironment | undefined {
  const existing = environments.get(doc);
  if (existing) {
    return existing;
  }
  const view = getLiveView(doc);
  if (!view || typeof view.matchMedia !== 'function') {
    return undefined;
  }
  const environment = createEnvironment(doc, view);
  environments.set(doc, environment);
  return environment;
}

function bindLight(element: HTMLElement): LightBinding {
  let eligible = !matchesSafe(element, unavailableSelector);
  let doc: Document | null = null;
  let environment: LightEnvironment | undefined;
  let subscription: PointerProximitySubscription | undefined;
  let hasLightMaterial = false;
  let reach = 0;
  let spaceHeld = false;
  let blocked = false;
  let ownedStyle: string | null = null;

  function paint(next: LightPaint): void {
    if (blocked !== (next === 'blocked')) {
      blocked = next === 'blocked';
      if (blocked) {
        setAttributeSafe(element, blockedAttribute, '');
      } else {
        removeAttributeSafe(element, blockedAttribute);
      }
    }
    const { style } = element;
    if (next && next !== 'blocked') {
      const values = [
        [lightX, `${next.x.toFixed(2)}px`],
        [lightY, `${next.y.toFixed(2)}px`],
        [lightStrength, next.strength.toFixed(3)],
      ] as const;
      for (const [name, value] of values) {
        if (style.getPropertyValue(name) !== value) {
          style.setProperty(name, value);
        }
      }
    } else {
      // Fade from the outgoing coordinates. The coordinates are cleared only
      // on teardown so a disappearing spot stays where it was last visible.
      style.removeProperty(lightStrength);
    }
    ownedStyle = getAttributeSafe(element, 'style');
  }

  function applyDemand(): void {
    const enabled = eligible && reach > 0 && !spaceHeld;
    if (!enabled) {
      paint('blocked');
    }
    subscription?.setEnabled(enabled);
    if (enabled) {
      subscription?.refresh();
    }
  }

  function clearPaint(): void {
    blocked = false;
    removeAttributeSafe(element, blockedAttribute);
    for (const name of [lightX, lightY, lightStrength]) {
      element.style.removeProperty(name);
    }
    ownedStyle = getAttributeSafe(element, 'style');
  }

  function connect(nextDoc: Document | null): void {
    subscription?.unsubscribe();
    if (doc) {
      clearPaint();
      spaceHeld = false;
    }
    environment?.remove(binding);
    doc = nextDoc;
    hasLightMaterial = false;
    reach = 0;
    environment = nextDoc ? getEnvironment(nextDoc) : undefined;
    subscription =
      nextDoc && environment
        ? subscribePointerProximity(
            element,
            {
              measure(position) {
                // Native :active also releases when a drag ends inside an iframe
                // and the parent receives no pointerup event.
                const result = matchesSafe(element, ':disabled, :active')
                  ? 'blocked'
                  : measureButtonLight(element, nextDoc, position, reach);
                return () => {
                  environment?.watchTopLayer();
                  paint(result);
                };
              },
              reset() {
                element.style.removeProperty(lightStrength);
                ownedStyle = getAttributeSafe(element, 'style');
              },
            },
            false,
          )
        : undefined;
    environment?.add(binding);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === ' ' && event.target === element && getLocalName(element) === 'button') {
      const held = event.type === 'keydown';
      if (spaceHeld !== held) {
        spaceHeld = held;
        applyDemand();
      }
    }
  }

  function onButtonBlur(): void {
    if (spaceHeld) {
      spaceHeld = false;
      applyDemand();
    }
  }

  const binding: LightBinding = {
    element,
    measureDemand() {
      const owner = getOwnerDocument(element);
      if (owner !== doc) {
        return () => connect(owner);
      }
      const style = isConnectedNode(element) ? getComputedStyleSafe(element) : null;
      const length = style?.getPropertyValue('--_btn-primary-backlight-reach').trim() ?? '';
      const range = /^\d+(?:\.\d+)?px$/.test(length) ? Number.parseFloat(length) : 0;
      const available =
        range > 0 &&
        style?.visibility === 'visible' &&
        style.pointerEvents !== 'none' &&
        !matchesSafe(element, ':disabled') &&
        !isInertElement(element);
      return () => {
        hasLightMaterial = range > 0;
        reach = available ? range : 0;
        applyDemand();
      };
    },
    update() {
      if (getOwnerDocument(element) !== doc) {
        connect(getOwnerDocument(element));
      }
      const next = !matchesSafe(element, unavailableSelector);
      if (eligible !== next) {
        eligible = next;
        applyDemand();
      }
    },
    pause() {
      eligible = false;
      spaceHeld = false;
      subscription?.setEnabled(false);
      clearPaint();
    },
    usesLightMaterial: () => hasLightMaterial,
    refresh() {
      subscription?.refresh();
    },
    clearKeyboardHold: onButtonBlur,
    ownsMutation(attribute) {
      return (
        attribute === blockedAttribute ||
        (attribute === 'style' && getAttributeSafe(element, 'style') === ownedStyle)
      );
    },
    dispose() {
      removeListenerSafe(element, 'keydown', onKey, true);
      removeListenerSafe(element, 'keyup', onKey, true);
      removeListenerSafe(element, 'blur', onButtonBlur);
      subscription?.unsubscribe();
      clearPaint();
      environment?.remove(binding);
    },
  };

  connect(getOwnerDocument(element));
  addListenerSafe(element, 'keydown', onKey, true);
  addListenerSafe(element, 'keyup', onKey, true);
  addListenerSafe(element, 'blur', onButtonBlur);
  return binding;
}

export function useButtonLight(): (host: HTMLElement | null) => void {
  const host = useRef<HTMLElement | null>(null);
  const binding = useRef<LightBinding | null>(null);
  const sync = useCallback(() => {
    const element = host.current;
    const candidate = element && matchesSafe(element, candidateSelector) ? element : null;
    if ((binding.current?.element ?? null) !== candidate) {
      const previous = binding.current;
      // Subscribe before releasing the previous host so a synchronous router
      // replacement keeps the existing same-document pointer position.
      binding.current = candidate ? bindLight(candidate) : null;
      previous?.dispose();
    }
    binding.current?.update();
  }, []);
  useIsoLayoutEffect(sync);
  return useCallback(
    (element) => {
      host.current = element;
      if (element) {
        sync();
      } else {
        const previous = binding.current;
        previous?.pause();
        queueMicrotask(() => {
          if (!host.current && binding.current === previous) {
            sync();
          }
        });
      }
    },
    [sync],
  );
}

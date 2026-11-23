import {
  addListenerSafe,
  getDefaultView,
  getRootNodeSafe,
  isElementNode,
  isInertElement,
  removeListenerSafe,
} from '../../core/dom.js';

export const segmentedOptionSelector = 'input[data-unica-segmented-option]';
const activationTargetSelector = '.unica-segmented-control-item, [data-unica-segmented-blocked]';

interface Activation {
  readonly choose: (input: HTMLInputElement) => void;
  readonly reconcile: () => void;
}

const observers = /* @__PURE__ */ new WeakMap<EventTarget, Map<Element, Activation>>();
const observedInputs = /* @__PURE__ */ new WeakSet<Event>();

function onActivationCapture(event: Event): void {
  const { currentTarget } = event;
  const target = event.composedPath()[0] ?? event.target;
  if (!currentTarget || !isElementNode(target)) {
    return;
  }
  const rail = target.closest('.unica-segmented-control');
  const activation = rail && observers.get(currentTarget)?.get(rail);
  if (!rail || !activation || !target.closest(activationTargetSelector)) {
    return;
  }
  const root = getRootNodeSafe(rail);
  if (currentTarget !== root && observers.get(root)?.has(rail)) {
    return;
  }
  const option = target.matches(segmentedOptionSelector) ? (target as HTMLInputElement) : null;
  const blocked =
    rail.hasAttribute('data-unica-segmented-readonly') ||
    rail.getAttribute('aria-disabled') === 'true' ||
    Boolean(target.closest('[data-unica-segmented-blocked]')) ||
    isInertElement(target);
  if (event.type === 'input') {
    // Native input follows accepted activation, even if React propagation stops.
    observedInputs.add(event);
    if (option?.checked && !blocked) {
      activation.choose(option);
    } else if (option) {
      activation.reconcile();
    }
    return;
  }
  if (blocked) {
    event.preventDefault();
    if (option) {
      activation.reconcile();
    }
  }
  if (option) {
    // A canceled native click can restore old checkedness after click
    // handlers, including after a synchronous owner update.
    getDefaultView(target.ownerDocument)?.setTimeout(() => {
      if (event.defaultPrevented) {
        activation.reconcile();
      }
    }, 0);
  }
}

export function observedSegmentedInput(event: Event): boolean {
  return observedInputs.has(event);
}

function observeRoot(root: Node, rail: HTMLDivElement, activation: Activation): () => void {
  let controls = observers.get(root);
  if (!controls) {
    controls = new Map();
    observers.set(root, controls);
    addListenerSafe(root, 'click', onActivationCapture, true);
    addListenerSafe(root, 'input', onActivationCapture, true);
  }
  controls.set(rail, activation);
  return () => {
    controls.delete(rail);
    if (controls.size === 0) {
      removeListenerSafe(root, 'click', onActivationCapture, true);
      removeListenerSafe(root, 'input', onActivationCapture, true);
      observers.delete(root);
    }
  };
}

export function observeSegmentedActivation(
  rail: HTMLDivElement,
  activation: Activation,
): () => void {
  const doc = rail.ownerDocument;
  const root = getRootNodeSafe(rail);
  // Controls may mount in a detached fragment and then be inserted into the document.
  const stopDocument = observeRoot(doc, rail, activation);
  const stopRoot = root === doc ? undefined : observeRoot(root, rail, activation);
  return () => {
    stopRoot?.();
    stopDocument();
  };
}

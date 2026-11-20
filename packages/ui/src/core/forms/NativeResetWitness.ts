import {
  addListenerSafe,
  getDefaultView,
  getFormElements,
  getOwnerDocument,
  getRootNodeSafe,
  isHtmlForm,
  removeListenerSafe,
} from './dom.js';

export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type ResetResult = 'reset' | 'repair';

type ResetEvent = Pick<Event, 'isTrusted' | 'defaultPrevented' | 'eventPhase'>;

export interface ResetOperation {
  finish: (confirmed: boolean) => ResetResult | undefined;
}

// Trust belongs to this dispatch. The same Event can later be dispatched by script.
export function createResetOperation(event: ResetEvent): ResetOperation {
  const trusted = event.isTrusted;
  let sealed = false;
  return {
    finish(confirmed) {
      if (sealed || event.eventPhase !== 0) {
        return undefined;
      }
      sealed = true;
      return confirmed && trusted && !event.defaultPrevented ? 'reset' : 'repair';
    },
  };
}

interface Subscription {
  notify: (result: ResetResult) => void;
}

const roots = /* @__PURE__ */ new WeakMap<Node, Set<Subscription>>();
const controlSubscriptions = /* @__PURE__ */ new WeakMap<FormControl, Set<Subscription>>();
const dispatches = /* @__PURE__ */ new WeakMap<Event, () => void>();

function collectFormSubscriptions(form: HTMLFormElement): Set<Subscription> {
  const targets = new Set<Subscription>();
  const elements = getFormElements(form);
  for (let index = 0; index < elements.length; index++) {
    const subs = controlSubscriptions.get(elements[index] as FormControl);
    if (subs) {
      for (const subscription of subs) {
        targets.add(subscription);
      }
    }
  }
  return targets;
}

function handleReset(event: Event): void {
  if (!isHtmlForm(event.target)) {
    return;
  }
  const form = event.target;
  const ownerRoot = getRootNodeSafe(form);
  if (roots.has(ownerRoot)) {
    if (event.currentTarget !== ownerRoot) {
      return;
    }
  } else {
    const path = event.composedPath();
    if (event.currentTarget !== path.findLast((node) => roots.has(node as Node))) {
      return;
    }
  }

  // Dispatch can reuse an Event object before the previous cleanup microtask.
  dispatches.get(event)?.();
  const operation = createResetOperation(event);
  const currentTarget = event.currentTarget;
  const view = getDefaultView(getOwnerDocument(form));
  let active = true;
  let bubbleBound = false;
  let cancelFallback: (() => void) | undefined;

  const cleanup = (): void => {
    active = false;
    dispatches.delete(event);
    if (bubbleBound) {
      bubbleBound = false;
      removeListenerSafe(currentTarget, 'reset', onBubble, false);
    }
    if (cancelFallback) {
      cancelFallback();
      cancelFallback = undefined;
    }
  };

  const finish = (): void => {
    if (!active) {
      return;
    }
    const result = operation.finish(true);
    if (!result) {
      return;
    }
    cleanup();
    const targets = collectFormSubscriptions(form);
    if (targets.size === 0) {
      return;
    }
    let failure: { error: unknown } | undefined;
    for (const subscription of targets) {
      try {
        subscription.notify(result);
      } catch (error) {
        failure ??= { error };
      }
    }
    if (failure) {
      if (typeof view?.reportError === 'function') {
        view.reportError(failure.error);
      } else if (typeof reportError === 'function') {
        reportError(failure.error);
      } else {
        throw failure.error;
      }
    }
  };

  const onBubble = (observed: Event): void => {
    if (observed === event && active) {
      if (bubbleBound) {
        bubbleBound = false;
        removeListenerSafe(currentTarget, 'reset', onBubble, false);
      }
      queueMicrotask(finish);
    }
  };

  dispatches.set(event, cleanup);
  queueMicrotask(() => {
    if (!active) {
      return;
    }
    if (event.eventPhase === 0) {
      finish();
      return;
    }
    // A user-initiated reset button click can run microtasks between listeners.
    // Re-check right after bubble, with a cancelable zero-delay task fallback.
    bubbleBound = true;
    addListenerSafe(currentTarget, 'reset', onBubble, false);
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        finish();
      };
      cancelFallback = () => {
        channel.port1.onmessage = null;
        channel.port1.close();
        channel.port2.close();
      };
      channel.port2.postMessage(undefined);
    } else if (view) {
      const timer = view.setTimeout(finish, 0);
      cancelFallback = () => view.clearTimeout(timer);
    } else {
      const timer = setTimeout(finish, 0);
      cancelFallback = () => clearTimeout(timer);
    }
  });
}

function bindRoot(root: Node, subscription: Subscription): () => void {
  let subscriptions = roots.get(root);
  if (!subscriptions) {
    subscriptions = new Set();
    addListenerSafe(root, 'reset', handleReset, true);
    roots.set(root, subscriptions);
  }
  subscriptions.add(subscription);

  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;
    subscriptions.delete(subscription);
    if (subscriptions.size === 0 && roots.get(root) === subscriptions) {
      roots.delete(root);
      removeListenerSafe(root, 'reset', handleReset, true);
    }
  };
}

export interface NativeResetSubscription {
  syncRoots: () => void;
  unsubscribe: () => void;
}

export function subscribeNativeReset(
  input: FormControl | readonly FormControl[],
  notify: (result: ResetResult) => void,
): NativeResetSubscription {
  const controls: FormControl[] = Array.isArray(input)
    ? Array.from(new Set<FormControl>(input as readonly FormControl[]))
    : [input as FormControl];
  const subscription: Subscription = { notify };
  const rootUnbinds = new Map<Node, () => void>();
  let active = true;

  function syncRoots(): void {
    if (!active) {
      return;
    }
    const nextRoots = new Set<Node>();
    for (const control of controls) {
      nextRoots.add(getRootNodeSafe(control));
    }
    for (const [root, unbind] of rootUnbinds) {
      if (!nextRoots.has(root)) {
        rootUnbinds.delete(root);
        unbind();
      }
    }
    for (const root of nextRoots) {
      if (!rootUnbinds.has(root)) {
        rootUnbinds.set(root, bindRoot(root, subscription));
      }
    }
  }

  for (const control of controls) {
    let subs = controlSubscriptions.get(control);
    if (!subs) {
      subs = new Set();
      controlSubscriptions.set(control, subs);
    }
    subs.add(subscription);
  }

  try {
    syncRoots();
  } catch (error) {
    for (const control of controls) {
      const subs = controlSubscriptions.get(control);
      subs?.delete(subscription);
      if (subs?.size === 0) {
        controlSubscriptions.delete(control);
      }
    }
    for (const unbind of rootUnbinds.values()) {
      unbind();
    }
    rootUnbinds.clear();
    active = false;
    throw error;
  }

  return {
    syncRoots,
    unsubscribe() {
      if (!active) {
        return;
      }
      active = false;
      for (const control of controls) {
        const subs = controlSubscriptions.get(control);
        subs?.delete(subscription);
        if (subs?.size === 0) {
          controlSubscriptions.delete(control);
        }
      }
      for (const unbind of rootUnbinds.values()) {
        unbind();
      }
      rootUnbinds.clear();
    },
  };
}

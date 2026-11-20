export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type ResetResult = 'reset' | 'repair';

type ResetEvent = Pick<Event, 'isTrusted' | 'defaultPrevented' | 'eventPhase'>;

interface ResetOperation {
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

const witnessTag = 'unica-reset-witness';
const observerTag = 'unica-form-root-observer';

interface WitnessElement extends HTMLElement {
  confirmReset: (() => void) | undefined;
}

interface RootObserverElement extends HTMLElement {
  rebind: (() => void) | undefined;
}

function createWitness(document: Document): WitnessElement | undefined {
  const realm = document.defaultView;
  if (!realm?.customElements) {
    return undefined;
  }
  if (!realm.customElements.get(witnessTag)) {
    realm.customElements.define(
      witnessTag,
      class extends realm.HTMLElement implements WitnessElement {
        static readonly formAssociated = true;
        confirmReset: WitnessElement['confirmReset'];

        constructor() {
          super();
          this.attachInternals();
        }

        formResetCallback(): void {
          this.confirmReset?.();
        }
      },
    );
  }
  return document.createElement(witnessTag) as WitnessElement;
}

function createRootObserver(document: Document): RootObserverElement | undefined {
  const realm = document.defaultView;
  if (!realm?.customElements) {
    return undefined;
  }
  if (!realm.customElements.get(observerTag)) {
    realm.customElements.define(
      observerTag,
      class extends realm.HTMLElement implements RootObserverElement {
        rebind: RootObserverElement['rebind'];

        connectedCallback(): void {
          this.rebind?.();
        }

        disconnectedCallback(): void {
          this.rebind?.();
        }
      },
    );
  }
  return document.createElement(observerTag) as RootObserverElement;
}

interface Subscription {
  control: FormControl;
  notify: (result: ResetResult) => void;
}

interface PendingReset {
  actionRan: () => boolean;
  cohort: Set<Subscription>;
  superseded: Set<Subscription>;
  marker: HTMLInputElement;
  witness: WitnessElement;
}

const roots = new WeakMap<Node, Set<Subscription>>();
const formEpochs = new WeakMap<HTMLFormElement, { issued: number; restored: number }>();
const pendingResets = new Set<PendingReset>();
const dispatches = new WeakMap<Event, () => void>();

function associatedSubscriptions(form: HTMLFormElement): Set<Subscription> {
  const owned = new Set<Subscription>();
  // A detached subtree can still receive a reset on an observed ancestor after
  // insertion into a fragment, even though its getRootNode() has changed.
  for (let ancestor: Node | null = form; ancestor; ancestor = ancestor.parentNode) {
    for (const subscription of roots.get(ancestor) ?? []) {
      if (subscription.control.form === form) {
        owned.add(subscription);
      }
    }
  }
  return owned;
}

function handleReset(event: Event): void {
  const target = event.target as Node | null;
  const FormElement = target?.ownerDocument?.defaultView?.HTMLFormElement;
  if (!FormElement || !(target instanceof FormElement)) {
    return;
  }
  const form = target;
  const path = event.composedPath();
  if (event.currentTarget !== path.findLast((node) => roots.has(node as Node))) {
    return;
  }

  // Dispatch can reuse an Event object before the previous cleanup microtask.
  dispatches.get(event)?.();
  const operation = createResetOperation(event);
  const epochs = formEpochs.get(form) ?? { issued: 0, restored: 0 };
  formEpochs.set(form, epochs);
  const epoch = ++epochs.issued;
  const endpoint = path.at(-1);
  let pending: PendingReset | undefined;
  let active = true;

  const cleanup = (): void => {
    active = false;
    dispatches.delete(event);
    form.removeEventListener('reset', observeTail);
    endpoint?.removeEventListener('reset', observeTail);
    if (pending) {
      pendingResets.delete(pending);
      pending.witness.confirmReset = undefined;
      pending.witness.remove();
      pending.marker.remove();
    }
  };

  const finish = (confirmed: boolean): void => {
    const result = active ? operation.finish(confirmed) : undefined;
    if (!result) {
      return;
    }
    cleanup();
    const reset = result === 'reset' && epoch > epochs.restored;
    if (reset) {
      epochs.restored = epoch;
    }

    for (const subscription of associatedSubscriptions(form)) {
      const canRestore =
        reset && pending?.cohort.has(subscription) && !pending.superseded.has(subscription);
      subscription.notify(canRestore ? 'reset' : 'repair');
    }
  };

  const prepare = (): void => {
    const cohort = associatedSubscriptions(form);
    if (pending) {
      pending.cohort = cohort;
      return;
    }
    if (cohort.size === 0) {
      return;
    }
    const witness = createWitness(form.ownerDocument);
    if (!witness) {
      return;
    }

    // The marker shows whether the native action has run. It is reset before
    // the FACE callback and remains armed throughout the event dispatch.
    const marker = form.ownerDocument.createElement('input');
    marker.hidden = true;
    marker.value = 'pending';
    witness.hidden = true;
    const action: PendingReset = {
      actionRan: () => event.eventPhase === 0 && marker.value === '',
      cohort,
      superseded: new Set(),
      marker,
      witness,
    };
    pending = action;
    pendingResets.add(action);
    witness.confirmReset = () => {
      if (action.actionRan()) {
        finish(true);
      }
    };
    form.append(marker, witness);
  };

  const observeTail = (observed: Event): void => {
    if (observed === event) {
      prepare();
    }
  };

  dispatches.set(event, cleanup);
  prepare();
  // A reset handler can change associations before the default action runs.
  // Take the final cohort during propagation so a delayed witness cannot
  // grant reset authority to controls added after the browser acted.
  form.addEventListener('reset', observeTail);
  endpoint?.addEventListener('reset', observeTail);

  queueMicrotask(() => {
    if (event.eventPhase === 0) {
      finish(false);
    } else {
      // A user-initiated event can run microtasks between native listeners.
      setTimeout(() => finish(false), 0);
    }
  });
}

function bindRoot(root: Node, subscription: Subscription): () => void {
  let subscriptions = roots.get(root);
  if (!subscriptions) {
    subscriptions = new Set();
    roots.set(root, subscriptions);
    root.addEventListener('reset', handleReset, true);
  }
  subscriptions.add(subscription);
  return () => {
    subscriptions.delete(subscription);
    if (subscriptions.size === 0) {
      root.removeEventListener('reset', handleReset, true);
      roots.delete(root);
    }
  };
}

export interface NativeResetSubscription {
  noteCommit: () => void;
  unsubscribe: () => void;
}

export function subscribeNativeReset(
  control: FormControl,
  notify: (result: ResetResult) => void,
): NativeResetSubscription {
  const subscription = { control, notify };
  let currentRoot: Node | undefined;
  let unbind: (() => void) | undefined;

  function rebind(): void {
    const root = control.getRootNode();
    if (root !== currentRoot) {
      unbind?.();
      currentRoot = root;
      unbind = bindRoot(root, subscription);
    }
  }

  // The observer travels with the carrier's root. Its native lifecycle can rebind
  // on a DOM move before a synchronous reset in the new tree.
  const observer = createRootObserver(control.ownerDocument);
  if (observer) {
    observer.hidden = true;
    observer.rebind = rebind;
    control.after(observer);
  }
  rebind();

  return {
    noteCommit() {
      for (const pending of pendingResets) {
        if (pending.cohort.has(subscription) && pending.actionRan()) {
          pending.superseded.add(subscription);
        }
      }
    },
    unsubscribe() {
      if (observer) {
        observer.rebind = undefined;
        observer.remove();
      }
      unbind?.();
    },
  };
}

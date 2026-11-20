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
  superseded: Set<Subscription>;
}

interface FormEpochs {
  issued: number;
  restored: number;
  pending: Set<PendingReset>;
}

const roots = new WeakMap<Node, Set<Subscription>>();
const formEpochs = new WeakMap<HTMLFormElement, FormEpochs>();

function handleReset(event: Event): void {
  const form = event.target as Node | null;
  const FormElement = form?.ownerDocument?.defaultView?.HTMLFormElement;
  if (!FormElement || !(form instanceof FormElement)) {
    return;
  }

  const epochs = formEpochs.get(form) ?? {
    issued: 0,
    restored: 0,
    pending: new Set<PendingReset>(),
  };
  formEpochs.set(form, epochs);
  const epoch = ++epochs.issued;
  const operation = createResetOperation(event);
  const witness = createWitness(form.ownerDocument);
  // The marker is reset immediately before the witness. A queued reaction from an
  // earlier dispatch cannot confirm this one while its marker is still armed.
  const marker = form.ownerDocument.createElement('input');
  marker.hidden = true;
  marker.value = 'pending';
  const pending: PendingReset = {
    actionRan: () => event.eventPhase === 0 && marker.value === '',
    superseded: new Set(),
  };
  epochs.pending.add(pending);

  const finish = (confirmed: boolean): void => {
    const result = operation.finish(confirmed);
    if (!result) {
      return;
    }
    epochs.pending.delete(pending);
    if (witness) {
      witness.confirmReset = undefined;
      witness.remove();
    }
    marker.remove();
    const reset = result === 'reset' && epoch > epochs.restored;
    if (reset) {
      epochs.restored = epoch;
    }

    // A reset listener can move the form or change which controls it owns.
    const subscriptions = roots.get(form.getRootNode());
    if (!subscriptions) {
      return;
    }
    for (const subscription of [...subscriptions]) {
      if (subscriptions.has(subscription) && subscription.control.form === form) {
        subscription.notify(reset && !pending.superseded.has(subscription) ? 'reset' : 'repair');
      }
    }
  };

  if (witness) {
    witness.hidden = true;
    witness.confirmReset = () => {
      if (pending.actionRan()) {
        finish(true);
      }
    };
    form.append(marker, witness);
  }

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
      const form = control.form;
      if (form) {
        for (const pending of formEpochs.get(form)?.pending ?? []) {
          if (pending.actionRan()) {
            pending.superseded.add(subscription);
          }
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

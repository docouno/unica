type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
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

interface WitnessElement extends HTMLElement {
  confirmReset: (() => void) | undefined;
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

interface Subscription {
  control: FormControl;
  notify: (result: ResetResult) => void;
}

type RootListener = (event: Event) => void;

interface RootSubscription {
  subscriptions: Set<Subscription>;
  listener: RootListener;
}

const roots = new WeakMap<Node, RootSubscription>();
const formEpochs = new WeakMap<HTMLFormElement, { issued: number; restored: number }>();

function handleReset(subscriptions: Set<Subscription>, event: Event): void {
  const matching = [...subscriptions].filter(({ control }) => control.form === event.target);
  const form = matching[0]?.control.form;
  if (!form) {
    return;
  }
  const epochs = formEpochs.get(form) ?? { issued: 0, restored: 0 };
  formEpochs.set(form, epochs);
  const epoch = ++epochs.issued;

  const operation = createResetOperation(event);
  const witness = createWitness(form.ownerDocument);
  // The marker is reset immediately before the witness. A queued reaction from an
  // earlier dispatch cannot confirm this one while its marker is still armed.
  const marker = form.ownerDocument.createElement('input');
  marker.hidden = true;
  marker.value = 'pending';

  function finish(confirmed: boolean): void {
    const result = operation.finish(confirmed);
    if (!result) {
      return;
    }
    if (witness) {
      witness.confirmReset = undefined;
      witness.remove();
    }
    marker.remove();
    const reset = result === 'reset' && epoch > epochs.restored;
    if (reset) {
      epochs.restored = epoch;
    }
    for (const subscription of matching) {
      if (subscriptions.has(subscription) && subscription.control.form === form) {
        subscription.notify(reset ? 'reset' : 'repair');
      }
    }
  }

  if (witness) {
    witness.hidden = true;
    witness.confirmReset = () => {
      if (marker.value === '') {
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

export function subscribeNativeReset(
  root: Node,
  control: FormControl,
  notify: (result: ResetResult) => void,
): () => void {
  let entry = roots.get(root);
  if (!entry) {
    const subscriptions = new Set<Subscription>();
    entry = { subscriptions, listener: (event) => handleReset(subscriptions, event) };
    roots.set(root, entry);
    root.addEventListener('reset', entry.listener, true);
  }

  const { subscriptions, listener } = entry;
  const subscription = { control, notify };
  subscriptions.add(subscription);
  return () => {
    subscriptions.delete(subscription);
    if (subscriptions.size === 0) {
      root.removeEventListener('reset', listener, true);
      roots.delete(root);
    }
  };
}

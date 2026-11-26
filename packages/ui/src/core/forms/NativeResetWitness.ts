import {
  addListenerSafe,
  containsSafe,
  getAttributeSafe,
  getDefaultView,
  getFormElements,
  getLocalName,
  getOwnerDocument,
  getRootNodeSafe,
  isElementNode,
  isHtmlForm,
  removeListenerSafe,
} from '../dom.js';

export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type ResetResult = 'reset' | 'repair';

type ResetEvent = Pick<Event, 'isTrusted' | 'defaultPrevented' | 'eventPhase'>;

export interface ResetOperation {
  finish: () => ResetResult | undefined;
}

// Trust belongs to this dispatch. The same Event can later be dispatched by script.
export function createResetOperation(event: ResetEvent): ResetOperation {
  const trusted = event.isTrusted;
  let sealed = false;
  return {
    finish() {
      if (sealed || event.eventPhase !== 0) {
        return undefined;
      }
      sealed = true;
      return trusted && !event.defaultPrevented ? 'reset' : 'repair';
    },
  };
}

interface Subscription {
  notify: (result: ResetResult) => void;
  readonly controls: readonly FormControl[];
  readonly prepare?: (() => () => void) | undefined;
}

type PendingReset = (subscription?: Subscription, editedControl?: FormControl) => void;

interface ResetObservation {
  readonly control: FormControl;
  readonly owned: boolean;
  readonly appliedDefault: (retainedOwner: boolean) => boolean;
}

const resetTargets = /* @__PURE__ */ new WeakMap<Node, Set<Subscription>>();
const dispatches = /* @__PURE__ */ new WeakMap<Event, () => void>();
const pendingResets = /* @__PURE__ */ new Set<PendingReset>();

function matchesCheckedDefault(input: HTMLInputElement): boolean {
  const { checked, defaultChecked, form, name, type } = input;
  if (!defaultChecked || type !== 'radio' || !name || !form) {
    return checked === defaultChecked;
  }
  // Reset evaluates the named radio set in form order. A later default can uncheck this radio.
  const lastDefault = Array.from(getFormElements(form)).findLast((element) => {
    if (getLocalName(element) !== 'input') {
      return false;
    }
    const peer = element as HTMLInputElement;
    return peer.type === 'radio' && peer.name === name && peer.defaultChecked;
  }) as HTMLInputElement | undefined;
  return lastDefault?.checked === true && checked === (lastDefault === input);
}

function captureResetValue(control: FormControl): ResetObservation['appliedDefault'] {
  const tag = getLocalName(control);
  if (tag === 'select') {
    const select = control as HTMLSelectElement;
    const before = Array.from(select.selectedOptions);
    return (retainedOwner) => {
      const after = Array.from(select.selectedOptions);
      const changed =
        before.length !== after.length || before.some((option, index) => option !== after[index]);
      return (
        (changed || retainedOwner) &&
        Array.from(select.options).every((option) => option.selected === option.defaultSelected)
      );
    };
  }
  const input = control as HTMLInputElement;
  if (tag === 'input' && (input.type === 'checkbox' || input.type === 'radio')) {
    const before = input.checked;
    return (retainedOwner) =>
      (before !== input.checked || retainedOwner) && matchesCheckedDefault(input);
  }
  const field = control as HTMLInputElement | HTMLTextAreaElement;
  const before = field.value;
  return (retainedOwner) => {
    // A follow-on range event can replace the reset value before this witness
    // settles. With the same form owner, the trusted reset still ends its edit.
    if (retainedOwner && tag === 'input' && input.type === 'range') {
      return true;
    }
    const value = field.value;
    if (!retainedOwner && value === before) {
      return false;
    }
    if (tag === 'input' && input.type === 'file') {
      return value === '';
    }
    if (value === field.defaultValue) {
      return true;
    }
    // Inputs such as email can sanitize the default before applying it.
    // Use a detached copy to observe the same normalization without touching the field.
    const probe = field.cloneNode(false) as typeof field;
    probe.value = field.defaultValue;
    return probe.value === value;
  };
}

function observeReset(form: HTMLFormElement, root: Node): Map<Subscription, ResetObservation[]> {
  const observations = new Map<Subscription, ResetObservation[]>();
  const subscriptions = new Set([
    ...(resetTargets.get(root) ?? []),
    ...(resetTargets.get(form) ?? []),
  ]);
  for (const subscription of subscriptions) {
    observations.set(
      subscription,
      subscription.controls
        .filter((control) => getRootNodeSafe(control) === root)
        .map((control) => ({
          control,
          owned: control.form === form,
          appliedDefault: captureResetValue(control),
        })),
    );
  }
  return observations;
}

function formAssociationChanged(
  control: FormControl,
  form: HTMLFormElement,
  mutations: readonly MutationRecord[],
): boolean {
  const formId = getAttributeSafe(control, 'form');
  const elementPrototype = getDefaultView(getOwnerDocument(form))?.Element.prototype;
  return mutations.some((record) => {
    if (record.type === 'attributes' && isElementNode(record.target)) {
      if (record.attributeName === 'form') {
        return record.target === control && record.oldValue !== formId;
      }
      const id = getAttributeSafe(record.target, 'id');
      return Boolean(
        formId &&
        record.oldValue !== id &&
        (record.target === form || record.oldValue === formId || id === formId),
      );
    }
    return [...record.addedNodes, ...record.removedNodes].some((node) => {
      if (containsSafe(node, control) || containsSafe(node, form)) {
        return true;
      }
      return Boolean(
        formId &&
        isElementNode(node) &&
        (getAttributeSafe(node, 'id') === formId ||
          Array.from(elementPrototype?.querySelectorAll.call(node, '[id]') ?? []).some(
            (element) => getAttributeSafe(element, 'id') === formId,
          )),
      );
    });
  });
}

function handleReset(event: Event): void {
  if (!isHtmlForm(event.target)) {
    return;
  }
  const form = event.target;
  const root = getRootNodeSafe(form);
  if (event.currentTarget !== root && event.currentTarget !== form) {
    return;
  }
  // The form binding survives a move to a new root. If the root already
  // observed this native dispatch, the form listener has nothing more to collect.
  if (event.currentTarget === form && form !== root && event.isTrusted && dispatches.has(event)) {
    return;
  }

  // Dispatch can reuse an Event object before the previous cleanup microtask.
  dispatches.get(event)?.();
  // Settle earlier dispatches before this reset can overwrite their native values.
  flushPendingResets();
  const operation = createResetOperation(event);
  const observations = observeReset(form, root);
  const view = getDefaultView(getOwnerDocument(form));
  let associationRecords: MutationRecord[] = [];
  const hasNumber = [...observations.values()].some((entries) =>
    entries.some(
      ({ control, owned }) =>
        owned &&
        getLocalName(control) === 'input' &&
        (control as HTMLInputElement).type === 'number',
    ),
  );
  const association =
    event.isTrusted && hasNumber && view
      ? new view.MutationObserver((records) => {
          associationRecords = associationRecords.concat(records);
        })
      : undefined;
  association?.observe(root, {
    attributeFilter: ['form', 'id'],
    attributeOldValue: true,
    childList: true,
    subtree: true,
  });
  let active = true;
  let completed: Map<Subscription, ResetResult> | undefined;
  let cancelFallback: (() => void) | undefined;
  const prepared = new Map<Subscription, () => void>();

  const cleanup = (): void => {
    active = false;
    dispatches.delete(event);
    pendingResets.delete(finish);
    association?.disconnect();
    for (const end of prepared.values()) {
      end();
    }
    prepared.clear();
    if (cancelFallback) {
      cancelFallback();
      cancelFallback = undefined;
    }
  };

  function finish(only?: Subscription, editedControl?: FormControl): void {
    if (!active) {
      return;
    }
    if (!completed) {
      const result = operation.finish();
      if (!result) {
        return;
      }
      // Use the native form order, since an earlier reset callback can unmount
      // a later subscriber. React can register child effects before parent effects.
      const positions = new Map(
        Array.from(getFormElements(form), (control, index) => [control, index] as const),
      );
      // An edit can replace the reset value in the same task. Ownership
      // evidence is conclusive only if form association could not have changed
      // during that dispatch, including a temporary move followed by a return.
      const editorRetainedOwner =
        editedControl && association
          ? !formAssociationChanged(
              editedControl,
              form,
              associationRecords.concat(association.takeRecords()),
            )
          : false;
      association?.disconnect();
      associationRecords = [];
      const ordered: { subscription: Subscription; position: number }[] = [];
      for (const [subscription, controls] of observations) {
        const participants = controls.filter(({ control, owned, appliedDefault }) => {
          const stayed = owned && control.form === form;
          // Check what the browser applied even if the control returned to its
          // previous owner before this checkpoint.
          // A native edit can already have replaced the reset value. This hint
          // applies only to the editor reporting that event, never to peers.
          if (result !== 'reset') {
            return stayed;
          }
          return control === editedControl && stayed ? editorRetainedOwner : appliedDefault(stayed);
        });
        if (participants.length > 0) {
          const position = participants.reduce(
            (first, { control }) => Math.min(first, positions.get(control) ?? Infinity),
            Infinity,
          );
          ordered.push({ subscription, position });
        }
      }
      ordered.sort((first, second) => first.position - second.position);
      completed = new Map(ordered.map(({ subscription }) => [subscription, result]));
      for (const subscription of prepared.keys()) {
        if (!completed.has(subscription)) {
          completed.set(subscription, 'repair');
        }
      }
      observations.clear();
    }
    if (!only) {
      cleanup();
    }
    let failure: { error: unknown } | undefined;
    for (const subscription of only ? [only] : completed.keys()) {
      const result = completed.get(subscription);
      if (!result) {
        continue;
      }
      completed.delete(subscription);
      const end = prepared.get(subscription);
      prepared.delete(subscription);
      end?.();
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
  }

  dispatches.set(event, cleanup);
  pendingResets.add(finish);
  if (event.isTrusted && !event.defaultPrevented) {
    // A pair of range inputs may need temporary bounds even if it only joins
    // this form from a reset handler later in the native dispatch.
    for (const [subscription, controls] of observations) {
      if (controls.length && subscription.prepare) {
        prepared.set(subscription, subscription.prepare());
      }
    }
  }
  queueMicrotask(() => {
    if (!active) {
      return;
    }
    if (event.eventPhase === 0) {
      finish();
      return;
    }
    // A user-initiated reset button click runs microtasks while eventPhase !== 0.
    // Finish right after native dispatch completes via a zero-delay cancelable task.
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.onmessage = null;
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

function flushPendingResets(subscription?: Subscription, editedControl?: FormControl): void {
  if (pendingResets.size === 0) {
    return;
  }
  for (const finish of [...pendingResets]) {
    finish(subscription, editedControl);
  }
}

function bindResetTarget(target: Node, subscription: Subscription): () => void {
  let subscriptions = resetTargets.get(target);
  if (!subscriptions) {
    subscriptions = new Set();
    addListenerSafe(target, 'reset', handleReset, true);
    resetTargets.set(target, subscriptions);
  }
  subscriptions.add(subscription);

  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;
    subscriptions.delete(subscription);
    if (subscriptions.size === 0 && resetTargets.get(target) === subscriptions) {
      resetTargets.delete(target);
      removeListenerSafe(target, 'reset', handleReset, true);
    }
  };
}

export interface NativeResetSubscription {
  flushCompleted: (editedControl?: FormControl) => void;
  syncTargets: () => void;
  unsubscribe: () => void;
}

export function subscribeNativeReset(
  input: FormControl | readonly FormControl[],
  notify: (result: ResetResult) => void,
  prepare?: () => () => void,
): NativeResetSubscription {
  const controls: FormControl[] = Array.isArray(input)
    ? Array.from(new Set<FormControl>(input as readonly FormControl[]))
    : [input as FormControl];
  let active = true;
  const subscription: Subscription = {
    controls,
    prepare,
    notify(result) {
      if (active) {
        notify(result);
      }
    },
  };
  const unbinds = new Map<Node, () => void>();

  function syncTargets(): void {
    if (!active) {
      return;
    }
    // Avoid rebuilding bindings for a single control with the same root and form.
    if (controls.length === 1) {
      const control = controls[0]!;
      const root = getRootNodeSafe(control);
      const form = control.form;
      const count = form && form !== root ? 2 : 1;
      if (unbinds.size === count && unbinds.has(root) && (!form || unbinds.has(form))) {
        return;
      }
    }

    const nextTargets = new Set<Node>();
    for (const control of controls) {
      nextTargets.add(getRootNodeSafe(control));
      const form = control.form;
      if (form) {
        nextTargets.add(form);
      }
    }
    for (const [target, unbind] of unbinds) {
      if (!nextTargets.has(target)) {
        unbinds.delete(target);
        unbind();
      }
    }
    for (const target of nextTargets) {
      if (!unbinds.has(target)) {
        unbinds.set(target, bindResetTarget(target, subscription));
      }
    }
  }

  try {
    syncTargets();
  } catch (error) {
    for (const unbind of unbinds.values()) {
      unbind();
    }
    unbinds.clear();
    active = false;
    throw error;
  }

  return {
    flushCompleted(editedControl) {
      flushPendingResets(subscription, editedControl);
    },
    syncTargets,
    unsubscribe() {
      if (!active) {
        return;
      }
      active = false;
      for (const unbind of unbinds.values()) {
        unbind();
      }
      unbinds.clear();
    },
  };
}

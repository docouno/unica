import { useImperativeHandle, useLayoutEffect, useState } from 'react';
import type { Ref, RefObject } from 'react';

interface ChoiceState {
  readonly checked: boolean;
  readonly disabled: boolean;
}

interface ChoiceInput {
  readonly input: HTMLInputElement;
  readonly refresh: () => void;
}

interface RootBinding {
  readonly entries: Set<ChoiceInput>;
  readonly dispose: () => void;
}

const roots = new WeakMap<Node, RootBinding>();

function sameSelection(a: HTMLInputElement, b: HTMLInputElement): boolean {
  return (
    a === b ||
    (a.type === 'radio' &&
      b.type === 'radio' &&
      a.name !== '' &&
      a.name === b.name &&
      a.form === b.form)
  );
}

function syncCheckedTracker(input: HTMLInputElement): void {
  // Native activation and reset can change checkedness without invoking React's setter.
  const checked = input.checked;
  input.checked = checked;
}

function refreshSelection(input: HTMLInputElement, repairTracker = false): void {
  const root = input.getRootNode();
  const binding = roots.get(root);
  // Native radio activation unchecks the previous answer without emitting its own change.
  binding?.entries.forEach((entry) => {
    if (entry.input.getRootNode() === root && sameSelection(input, entry.input)) {
      if (repairTracker) {
        syncCheckedTracker(entry.input);
      }
      entry.refresh();
    }
  });
}

function afterAction(event: Event, refresh: () => void): void {
  queueMicrotask(() => {
    if (event.eventPhase === Event.NONE) {
      refresh();
    } else {
      // A trusted activation can drain microtasks while the native event is still dispatching.
      setTimeout(refresh, 0);
    }
  });
}

export function repairCanceledChoiceActivation(input: HTMLInputElement, event: Event): void {
  afterAction(event, () => {
    if (event.defaultPrevented) {
      refreshSelection(input, true);
    }
  });
}

function createBinding(root: Node, input: HTMLInputElement): RootBinding {
  const entries = new Set<ChoiceInput>();
  const handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | null;
    if (target?.localName === 'input') {
      afterAction(event, () => refreshSelection(target));
    }
  };
  const handleReset = (event: Event): void => {
    const trusted = event.isTrusted;
    afterAction(event, () => {
      entries.forEach((entry) => {
        if (entry.input.form !== event.target) {
          return;
        }
        if (trusted && !event.defaultPrevented) {
          syncCheckedTracker(entry.input);
        }
        entry.refresh();
      });
    });
  };
  const Observer = input.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer && new Observer(() => entries.forEach((entry) => entry.refresh()));
  observer?.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'form', 'id', 'name'],
  });
  root.addEventListener('change', handleChange, true);
  root.addEventListener('reset', handleReset, true);
  return {
    entries,
    dispose() {
      observer?.disconnect();
      root.removeEventListener('change', handleChange, true);
      root.removeEventListener('reset', handleReset, true);
    },
  };
}

function bindInput(input: HTMLInputElement, update: (state: ChoiceState) => void): () => void {
  let root: Node | undefined;
  let previous: ChoiceState | undefined;
  function unbind(): void {
    const binding = root && roots.get(root);
    if (!root || !binding) {
      return;
    }
    binding.entries.delete(entry);
    if (binding.entries.size === 0) {
      binding.dispose();
      roots.delete(root);
    }
    root = undefined;
  }

  const entry: ChoiceInput = {
    input,
    refresh() {
      const nextRoot = input.getRootNode();
      if (nextRoot !== root) {
        unbind();
        root = nextRoot;
        let binding = roots.get(root);
        if (!binding) {
          binding = createBinding(root, input);
          roots.set(root, binding);
        }
        binding.entries.add(entry);
      }
      const checked = input.checked;
      const disabled = input.matches(':disabled');
      if (previous?.checked !== checked || previous.disabled !== disabled) {
        previous = { checked, disabled };
        update(previous);
      }
    },
  };
  entry.refresh();
  return unbind;
}

export function useChoiceInput(
  inputRef: RefObject<HTMLInputElement | null>,
  ref: Ref<HTMLInputElement> | undefined,
  checked: boolean | undefined,
  defaultChecked: boolean | undefined,
  disabled: boolean | undefined,
): ChoiceState {
  const [state, setState] = useState(() => ({
    checked: checked ?? defaultChecked ?? false,
    disabled: disabled ?? false,
  }));
  useImperativeHandle(ref, () => inputRef.current!, [inputRef]);

  useLayoutEffect(() => {
    const input = inputRef.current!;
    return bindInput(input, setState);
  }, [inputRef]);

  useLayoutEffect(() => {
    const input = inputRef.current!;
    if (checked !== undefined && input.defaultChecked !== checked) {
      // Keep a controlled card's latest check state across a native form reset.
      syncCheckedTracker(input);
      input.defaultChecked = checked;
    }
    refreshSelection(input);
  });

  return state;
}

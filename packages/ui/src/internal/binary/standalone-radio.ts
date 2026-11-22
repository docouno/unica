import { getRootNodeSafe, isElementNode } from '../../core/dom.js';
import { warnOnce } from '../../core/devWarning.js';
import { writeInputChecked } from '../../core/forms/carriers.js';
import { subscribeNativeReset } from '../../core/forms/NativeResetWitness.js';

interface RadioEntry {
  readonly input: HTMLInputElement;
  readonly initial: boolean;
  root: Node;
  form: HTMLFormElement | null;
  name: string;
  controlled: boolean | undefined;
  committed: boolean;
  reset: ReturnType<typeof subscribeNativeReset> | undefined;
}

interface RootRadios {
  readonly entries: Map<HTMLInputElement, RadioEntry>;
  readonly detach: () => void;
}

const roots = /* @__PURE__ */ new WeakMap<Node, RootRadios>();

function isPeer(peer: HTMLInputElement, input: HTMLInputElement, root: Node): boolean {
  return peer.name === input.name && peer.form === input.form && getRootNodeSafe(peer) === root;
}

function add(entry: RadioEntry): void {
  const { root } = entry;
  let registry = roots.get(root);
  if (!registry) {
    const entries = new Map<HTMLInputElement, RadioEntry>();
    function nativeChange(event: Event): void {
      const target = event.target;
      if (!isElementNode(target) || target.localName !== 'input') {
        return;
      }
      const input = target as HTMLInputElement;
      if (input.type !== 'radio' || !input.name || !input.checked || entries.has(input)) {
        return;
      }
      // A plain HTML peer can uncheck a standalone Unica radio without a second change event.
      for (const peer of entries.values()) {
        if (peer.controlled === undefined && isPeer(peer.input, input, root)) {
          peer.committed = peer.input.checked;
          writeInputChecked(peer.input, peer.committed, { force: true });
        }
      }
    }
    root.addEventListener('change', nativeChange, true);
    registry = { entries, detach: () => root.removeEventListener('change', nativeChange, true) };
    roots.set(root, registry);
  }
  registry.entries.set(entry.input, entry);
}

function remove(entry: RadioEntry): void {
  const registry = roots.get(entry.root);
  registry?.entries.delete(entry.input);
  if (registry?.entries.size === 0) {
    registry.detach();
    roots.delete(entry.root);
  }
}

function peersOf(entry: RadioEntry): RadioEntry[] {
  const { input, root } = entry;
  const registry = roots.get(root);
  if (!registry || !input.name) {
    return [entry];
  }
  return [...registry.entries.values()].filter((peer) => isPeer(peer.input, input, root));
}

function writePeers(peers: readonly RadioEntry[], selected: RadioEntry | undefined): void {
  // A native click clears the former peer without touching its React checkedness tracker.
  for (const peer of peers) {
    peer.committed = peer === selected;
    if (peer !== selected) {
      writeInputChecked(peer.input, false, { force: true });
    }
  }
  if (selected) {
    writeInputChecked(selected.input, true, { force: true });
  }
}

function controlledPeer(peers: readonly RadioEntry[]): RadioEntry | undefined {
  return peers.find((peer) => peer.controlled === true);
}

function selectedPeer(peers: readonly RadioEntry[]): RadioEntry | undefined {
  return controlledPeer(peers) ?? peers.find((peer) => peer.committed);
}

export function repairStandaloneRadioSet(input: HTMLInputElement): void {
  const root = getRootNodeSafe(input);
  const entries = roots.get(root)?.entries;
  if (input.name && entries) {
    const peers = [...entries.values()].filter((peer) => isPeer(peer.input, input, root));
    writePeers(peers, selectedPeer(peers));
  }
}

function resetPeer(peers: readonly RadioEntry[]): RadioEntry | undefined {
  return (
    controlledPeer(peers) ??
    peers.find((peer) => peer.controlled === undefined && peer.input.checked)
  );
}

export interface StandaloneRadio {
  readonly update: (checked: boolean | undefined) => void;
  readonly propose: (checked: boolean) => boolean;
  readonly hasControlledSelection: () => boolean;
  readonly repair: () => void;
  readonly refreshRoot: () => void;
  readonly dispose: () => void;
}

export function registerStandaloneRadio(
  input: HTMLInputElement,
  defaultChecked: boolean,
  checked: boolean | undefined,
): StandaloneRadio {
  const entry: RadioEntry = {
    input,
    initial: defaultChecked,
    root: getRootNodeSafe(input),
    form: input.form,
    name: input.name,
    controlled: checked,
    committed: false,
    reset: undefined,
  };
  add(entry);

  function refreshRoot(reconcile = true): void {
    const root = getRootNodeSafe(input);
    const { form, name } = input;
    if (root === entry.root && form === entry.form && name === entry.name) {
      return;
    }
    if (root !== entry.root) {
      remove(entry);
      entry.root = root;
      add(entry);
      entry.reset?.syncRoots();
    }
    entry.form = form;
    entry.name = name;
    if (reconcile) {
      // The browser reconciles two HTML radio sets when their name or form owner changes.
      const peers = peersOf(entry);
      const selected =
        controlledPeer(peers) ??
        peers.find((peer) => peer.controlled === undefined && peer.input.checked);
      writePeers(peers, selected);
    }
  }

  function setResetDefault(value: boolean): void {
    if (input.defaultChecked !== value) {
      input.defaultChecked = value;
    }
  }

  function update(next: boolean | undefined): void {
    refreshRoot();
    const previous = entry.controlled;
    if ((next === undefined) !== (previous === undefined)) {
      warnOnce(
        'standalone-radio-authority',
        'Radio switched between controlled and uncontrolled checked state.',
      );
    }
    entry.controlled = next;
    if (next === true && (previous !== next || !input.checked)) {
      writePeers(peersOf(entry), entry);
    } else if (next === false && (entry.committed || input.checked)) {
      entry.committed = false;
      writeInputChecked(input, false, { force: true });
    }
    setResetDefault(next ?? entry.initial);
  }

  const peers = peersOf(entry);
  const selected =
    controlledPeer(peers) ?? (input.checked && checked === undefined ? entry : selectedPeer(peers));
  // Initialize the accepted snapshot even when the pre-hydration DOM already matches.
  writePeers(peers, selected);
  setResetDefault(checked ?? defaultChecked);

  entry.reset = subscribeNativeReset(input, (result) => {
    refreshRoot(false);
    const peers = peersOf(entry);
    if (peers[0] === entry) {
      writePeers(peers, result === 'reset' ? resetPeer(peers) : selectedPeer(peers));
    }
  });

  let active = true;
  return {
    update,
    refreshRoot,
    hasControlledSelection: () => controlledPeer(peersOf(entry)) !== undefined,
    propose(next) {
      // Preserve the committed snapshot until the native candidate has been evaluated.
      refreshRoot(false);
      const peers = peersOf(entry);
      const current = selectedPeer(peers);
      const changed = next && !entry.committed;
      const accepted = changed && entry.controlled === undefined && current?.controlled !== true;
      writePeers(peers, accepted ? entry : current);
      return changed;
    },
    repair() {
      if (active) {
        refreshRoot(false);
        const peers = peersOf(entry);
        writePeers(peers, selectedPeer(peers));
      }
    },
    dispose() {
      active = false;
      remove(entry);
      entry.reset?.unsubscribe();
    },
  };
}

import { navigateCollection } from '../../core/collections/navigation.js';
import { warnOnce } from '../../core/devWarning.js';
import {
  getComputedStyleSafe,
  getDefaultView,
  getRootActiveElement,
  getRootNodeSafe,
  isElementNode,
  isHtmlForm,
  isInertElement,
  isRTL,
  matchesSafe,
} from '../../core/dom.js';
import { createGroupValidity } from './group-validity.js';
import { repairStandaloneRadioSet } from './standalone-radio.js';

export interface BinaryGroupDomConfig {
  readonly root: HTMLDivElement;
  readonly kind: 'checkbox' | 'radio' | 'switch';
  readonly sharedOwner: boolean;
  readonly keyed?: boolean | undefined;
  readonly form: string | undefined;
  readonly required: boolean;
  readonly requiredMessage: string | undefined;
  readonly tabIndex?: number | undefined;
  readonly onMembersChange?: (() => void) | undefined;
  readonly onRadioSetChange?: (() => void) | undefined;
}

export interface BinaryGroupMemberOptions {
  readonly disabled: boolean;
  readonly tabIndex: number | undefined;
  readonly key: string | undefined;
  readonly name: string | undefined;
  readonly onAvailabilityChange?: ((disabled: boolean) => void) | undefined;
}

export interface BinaryGroupDom {
  prepare(options: Pick<BinaryGroupDomConfig, 'form' | 'sharedOwner' | 'keyed'>): void;
  configure(config: BinaryGroupDomConfig): void;
  watchValidity(input: HTMLInputElement): void;
  setMember(input: HTMLInputElement, options: BinaryGroupMemberOptions): void;
  removeMember(input: HTMLInputElement): void;
  getControls(): readonly HTMLInputElement[];
  sync(): void;
  syncValidity(): void;
  getRadioTarget(source: HTMLInputElement, key: string): HTMLInputElement | undefined;
  disconnect(): void;
}

interface Member {
  options: BinaryGroupMemberOptions;
  imposedDisabled: boolean;
  isolatedRadio: boolean;
  effectiveDisabled: boolean | undefined;
  unlisten?: () => void;
}

interface Scope {
  readonly root: Node;
  readonly form: HTMLFormElement | null;
}

interface RadioEntry {
  readonly root: HTMLDivElement;
  authoredTabIndex: number | undefined;
  target: HTMLInputElement;
}

function groupScope({ root, form }: BinaryGroupDomConfig): Scope {
  const tree = getRootNodeSafe(root);
  const candidate =
    form === undefined
      ? root.closest('form')
      : 'getElementById' in tree
        ? (tree as Document | DocumentFragment).getElementById(form)
        : null;
  return { root: tree, form: isHtmlForm(candidate) ? candidate : null };
}

function inScope(input: HTMLInputElement, scope: Scope): boolean {
  return getRootNodeSafe(input) === scope.root && input.form === scope.form;
}

function domOrder(first: HTMLInputElement, second: HTMLInputElement): number {
  const position = first.compareDocumentPosition(second);
  if (position & Node.DOCUMENT_POSITION_DISCONNECTED) {
    return 0;
  }
  return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function sameOrder(a: readonly HTMLInputElement[], b: readonly HTMLInputElement[]): boolean {
  return a.length === b.length && a.every((input, index) => input === b[index]);
}

function isOptionFocusable(input: HTMLInputElement): boolean {
  if (!input.isConnected || matchesSafe(input, ':disabled') || isInertElement(input)) {
    return false;
  }
  if (typeof input.checkVisibility === 'function') {
    return input.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true });
  }
  for (let node: Element | null = input; node; node = node.parentElement) {
    const style = getComputedStyleSafe(node);
    if (style?.display === 'none' || style?.contentVisibility === 'hidden') {
      return false;
    }
    if (node === input && (style?.visibility === 'hidden' || style?.visibility === 'collapse')) {
      return false;
    }
  }
  return true;
}

function isWebKit(input: HTMLElement): boolean {
  const agent = getDefaultView(input.ownerDocument)?.navigator.userAgent ?? '';
  // Blink also reports AppleWebKit. iOS browsers with their own product token still
  // use WebKit radio behavior.
  return /AppleWebKit\//u.test(agent) && !/(?:Chrome|Chromium|Edg|OPR)\//u.test(agent);
}

function updateIsolation(
  input: HTMLInputElement,
  member: Member,
  isolate: boolean,
  restoreName = true,
): void {
  if (isolate) {
    if (input.type === 'radio') {
      member.isolatedRadio = true;
      if (input.name) {
        repairStandaloneRadioSet(input);
        // Disabling a radio does not remove it from its native set or its required rule.
        input.removeAttribute('name');
      }
    }
    if (!input.disabled) {
      input.disabled = true;
      member.imposedDisabled = true;
    }
  } else {
    if (member.isolatedRadio) {
      member.isolatedRadio = false;
      if (restoreName && member.options.name !== undefined) {
        input.name = member.options.name;
      }
    }
    if (member.imposedDisabled) {
      member.imposedDisabled = false;
      input.disabled = member.options.disabled;
    }
  }
}

function validateKeys(
  kind: BinaryGroupDomConfig['kind'],
  entries: ReadonlyMap<HTMLInputElement, Member>,
): void {
  const used = new Set<string>();
  for (const { options } of entries.values()) {
    const key = options.key;
    if (key === undefined) {
      warnOnce(
        `${kind}-group-missing-value`,
        `Each option in a ${kind} group with a shared value needs a string value.`,
      );
    } else if (used.has(key)) {
      warnOnce(
        `${kind}-group-duplicate-value`,
        `Each option in a ${kind} group with a shared value needs a unique value.`,
      );
    } else {
      used.add(key);
    }
  }
}

export function createBinaryGroupDom(): BinaryGroupDom {
  const members = new Map<HTMLInputElement, Member>();
  const validity = createGroupValidity();
  let config: BinaryGroupDomConfig | undefined;
  let scope: Scope | undefined;
  let controls: readonly HTMLInputElement[] = [];
  let observer: MutationObserver | undefined;
  let observed = new Set<Node>();
  let focused: HTMLInputElement | undefined;
  let scheduledFocus = false;
  let radioEntry: RadioEntry | undefined;

  function getControls(): readonly HTMLInputElement[] {
    if (!config?.sharedOwner) {
      return controls;
    }
    const liveScope = groupScope(config);
    return controls.every((input) => inScope(input, liveScope))
      ? controls
      : controls.filter((input) => inScope(input, liveScope));
  }

  function syncValidity(): void {
    const inputs = getControls();
    let message: string | undefined;
    if (config?.required) {
      if (config.kind === 'radio') {
        // Retain native validation (including its locale) when the browser already
        // reports a missing radio value. Checked disabled peers may mask that rule.
        if (!inputs.some((input) => input.willValidate && input.validity.valueMissing)) {
          message = 'Select an option.';
        }
      } else {
        message = config.requiredMessage || 'Select at least one option.';
      }
    }
    validity.sync(inputs, message, isOptionFocusable);
    syncRadioEntry();
  }

  function forwardFocus(): void {
    const entry = radioEntry;
    if (entry && isOptionFocusable(entry.target)) {
      entry.root.tabIndex = -1;
      entry.target.focus();
    }
  }

  function releaseRadioEntry(): void {
    const entry = radioEntry;
    if (!entry) {
      return;
    }
    radioEntry = undefined;
    entry.root.removeEventListener('focus', forwardFocus);
    if (entry.authoredTabIndex !== undefined) {
      entry.root.tabIndex = entry.authoredTabIndex;
    } else {
      entry.root.removeAttribute('tabindex');
    }
  }

  function syncRadioEntry(): void {
    if (config?.kind !== 'radio' || !isWebKit(config.root)) {
      releaseRadioEntry();
      return;
    }
    const options = getControls();
    const checked = options.find((input) => input.checked);
    const target =
      checked && !isOptionFocusable(checked)
        ? options.find(
            (input) => (members.get(input)?.options.tabIndex ?? 0) >= 0 && isOptionFocusable(input),
          )
        : undefined;

    if (radioEntry) {
      radioEntry.authoredTabIndex = config.tabIndex;
    }
    if (!target) {
      releaseRadioEntry();
      return;
    }

    const { root, tabIndex } = config;
    if (!radioEntry || radioEntry.root !== root) {
      releaseRadioEntry();
      radioEntry = { root, target, authoredTabIndex: tabIndex };
      root.addEventListener('focus', forwardFocus);
    }
    radioEntry.target = target;
    // WebKit skips a native radio set when its checked input cannot take focus,
    // even if an available peer gets tabindex=0. Hand off its single sequential
    // entry to an available input, and remove the bridge from Tab while inside.
    const active = getRootActiveElement(getRootNodeSafe(root), root.ownerDocument);
    const index = options.some((input) => input === active) ? -1 : Math.max(0, tabIndex ?? 0);
    if (root.getAttribute('tabindex') !== String(index)) {
      root.tabIndex = index;
    }
  }

  function recoverFocus(previous: readonly HTMLInputElement[]): void {
    const missing = focused;
    if (!missing || scheduledFocus || (controls.includes(missing) && isOptionFocusable(missing))) {
      return;
    }
    scheduledFocus = true;
    queueMicrotask(() => {
      scheduledFocus = false;
      if (!config || focused !== missing) {
        return;
      }
      if (controls.includes(missing) && isOptionFocusable(missing)) {
        return;
      }
      focused = undefined;
      const root = getRootNodeSafe(config.root);
      const doc = config.root.ownerDocument;
      const active = getRootActiveElement(root, doc);
      if (active && active !== missing && active !== doc.body && active !== doc.documentElement) {
        return;
      }
      const oldIndex = Math.max(0, previous.indexOf(missing));
      const index = controls.indexOf(missing);
      const start = index < 0 ? oldIndex : index + 1;
      const replacement =
        controls.slice(start).find(isOptionFocusable) ??
        controls.slice(0, start).reverse().find(isOptionFocusable);
      replacement?.focus();
    });
  }

  function trackFocus(input: HTMLInputElement): () => void {
    function focus(): void {
      focused = input;
      if (radioEntry) {
        syncRadioEntry();
      }
    }

    function blur(event: FocusEvent): void {
      if (radioEntry) {
        queueMicrotask(syncRadioEntry);
      }
      if (focused !== input) {
        return;
      }
      if (event.relatedTarget) {
        focused = undefined;
      } else {
        // Native removal/disable can blur without a related target. Keep the old node
        // through mutation reconciliation, but forget an intentional blur to the page.
        queueMicrotask(() => {
          if (focused === input && controls.includes(input) && isOptionFocusable(input)) {
            focused = undefined;
          }
        });
      }
    }

    input.addEventListener('focus', focus);
    input.addEventListener('blur', blur);
    return () => {
      input.removeEventListener('focus', focus);
      input.removeEventListener('blur', blur);
    };
  }

  function relevantMutations(records: readonly MutationRecord[]): boolean {
    if (!config || records.length === 0) {
      return false;
    }
    const live = groupScope(config);
    if (live.root !== scope?.root || live.form !== scope.form) {
      return true;
    }
    const root = config.root;
    function related(node: Node): boolean {
      if (node.contains(root)) {
        return true;
      }
      for (const input of members.keys()) {
        if (node.contains(input)) {
          return true;
        }
      }
      return false;
    }

    return records.some((record) => {
      if (record.type === 'childList') {
        return (
          related(record.target) ||
          Array.from(record.addedNodes).some(related) ||
          Array.from(record.removedNodes).some(related)
        );
      }
      if (record.attributeName === 'form') {
        return members.has(record.target as HTMLInputElement);
      }
      if (record.attributeName === 'id') {
        return config?.sharedOwner === true;
      }
      return (
        (record.attributeName === 'disabled' || config?.required || config?.kind === 'radio') &&
        related(record.target)
      );
    });
  }

  function radioOwnerMutation(records: readonly MutationRecord[]): boolean {
    const name = config?.kind === 'radio' ? controls[0]?.name : undefined;
    if (!name) {
      return false;
    }
    function isRadio(node: Node): node is HTMLInputElement {
      return (
        isElementNode(node) &&
        node.localName === 'input' &&
        (node as HTMLInputElement).type === 'radio'
      );
    }
    function isNamedRadio(node: Node): boolean {
      return isRadio(node) && node.name === name;
    }
    return records.some((record) => {
      if (record.attributeName === 'id') {
        return isHtmlForm(record.target);
      }
      if (record.attributeName === 'form') {
        return isNamedRadio(record.target);
      }
      if (record.attributeName === 'name') {
        return isRadio(record.target) && record.oldValue === name && record.target.name !== name;
      }
      return (
        record.type === 'childList' &&
        Array.from(record.addedNodes).some(
          (node) =>
            isNamedRadio(node) ||
            (isElementNode(node) &&
              Array.from(node.querySelectorAll('input[type="radio"]')).some(isNamedRadio)),
        )
      );
    });
  }

  function reconcileMutations(
    records: readonly MutationRecord[],
    memberChanged = false,
    keyChanged = false,
  ): void {
    const radioSetChanged = radioOwnerMutation(records);
    if (memberChanged || radioSetChanged || relevantMutations(records)) {
      sync(keyChanged);
      if (radioSetChanged) {
        // Regrouping can uncheck a valid selection before a foreign peer is isolated.
        config?.onRadioSetChange?.();
      }
    }
  }

  function observe(): void {
    if (!config || !scope) {
      return;
    }
    const view = getDefaultView(config.root.ownerDocument);
    if (!view?.MutationObserver) {
      return;
    }
    const next = new Set<Node>();
    const observeTree = (node: Node): void => {
      const tree = getRootNodeSafe(node);
      next.add(tree);
      // Detached trees do not report the mutation that reattaches them to a document.
      if (!node.isConnected && node.ownerDocument) {
        next.add(node.ownerDocument);
      }
    };
    observeTree(config.root);
    for (const input of members.keys()) {
      observeTree(input);
    }
    if (observed.size === next.size && Array.from(next).every((tree) => observed.has(tree))) {
      return;
    }
    observer ??= new view.MutationObserver((records) => reconcileMutations(records));
    observer.disconnect();
    observed = next;
    const attributeFilter = ['disabled', 'form', 'id', 'name', 'hidden', 'inert', 'style', 'class'];
    for (const tree of observed) {
      observer.observe(tree, {
        attributes: true,
        attributeFilter,
        attributeOldValue: true,
        childList: true,
        subtree: true,
      });
    }
  }

  function sync(keyChanged = false): void {
    if (!config) {
      return;
    }
    const previous = scope;
    const previousControls = controls;
    scope = groupScope(config);
    const accepted = [];
    const availabilityUpdates: (() => void)[] = [];
    for (const [input, member] of members) {
      const isolate = config.sharedOwner && !inScope(input, scope);
      if (isolate) {
        validity.release(input);
      }
      updateIsolation(input, member, isolate);
      if (isolate) {
        warnOnce(
          `${config.kind}-group-form-owner`,
          `Options in a ${config.kind} group with shared form state must use the same form owner and DOM root.`,
        );
      } else {
        accepted.push(input);
      }
      const disabled = matchesSafe(input, ':disabled');
      if (disabled !== member.effectiveDisabled) {
        member.effectiveDisabled = disabled;
        availabilityUpdates.push(() => member.options.onAvailabilityChange?.(disabled));
      }
    }
    if (config.keyed || config.kind === 'radio') {
      validateKeys(config.kind, members);
    }
    accepted.sort(domOrder);
    const controlsChanged = !sameOrder(accepted, previousControls);
    if (controlsChanged) {
      controls = accepted;
    }
    observe();
    syncValidity();
    if (config.kind === 'radio') {
      recoverFocus(previousControls);
    }
    availabilityUpdates.forEach((update) => update());
    if (
      keyChanged ||
      controlsChanged ||
      previous?.root !== scope.root ||
      previous.form !== scope.form
    ) {
      config.onMembersChange?.();
    }
  }

  return {
    prepare(options) {
      if (config) {
        // Child layout effects can register before the group's own layout effect.
        // Publish form ownership before they observe the updated native input props.
        config = { ...config, ...options };
      }
    },
    configure(next) {
      config = next;
      sync();
    },
    watchValidity(input) {
      validity.watch(input, syncValidity);
    },
    setMember(input, options) {
      const previous = members.get(input);
      if (previous) {
        const keyChanged = options.key !== previous.options.key;
        const availabilityChanged =
          options.disabled !== previous.options.disabled ||
          options.tabIndex !== previous.options.tabIndex ||
          (previous.isolatedRadio && input.name !== '') ||
          matchesSafe(input, ':disabled') !== previous.effectiveDisabled;
        previous.options = options;
        reconcileMutations(
          observer?.takeRecords() ?? [],
          keyChanged || availabilityChanged,
          keyChanged,
        );
        return;
      }
      const member: Member = {
        options,
        imposedDisabled: false,
        isolatedRadio: false,
        effectiveDisabled: undefined,
      };
      if (input.type === 'radio') {
        member.unlisten = trackFocus(input);
      }
      members.set(input, member);
      sync();
    },
    removeMember(input) {
      const member = members.get(input);
      if (!member) {
        return;
      }
      member.unlisten?.();
      updateIsolation(input, member, false, false);
      validity.remove(input);
      members.delete(input);
      sync();
    },
    getControls,
    sync,
    syncValidity,
    getRadioTarget(source, key) {
      const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
      if (
        !horizontal &&
        key !== 'ArrowUp' &&
        key !== 'ArrowDown' &&
        key !== 'Home' &&
        key !== 'End'
      ) {
        return undefined;
      }
      const options = getControls();
      const webKit = isWebKit(source);
      const items = options.map((input, index) => ({
        key: String(index),
        label: '',
        navigable: isOptionFocusable(input),
      }));
      if (
        horizontal &&
        !webKit &&
        items.every((item, index) => item.navigable || matchesSafe(options[index]!, ':disabled'))
      ) {
        return undefined;
      }
      // WebKit's native horizontal order follows DOM order even under RTL, and
      // its arrow behavior can change focus without selecting. Other engines
      // mirror horizontal arrows in RTL but can select a peer that is inert.
      const result = navigateCollection(
        {
          key,
          defaultPrevented: false,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          isComposing: false,
        },
        {
          items,
          activeKey: String(options.indexOf(source)),
          orientation: 'both',
          direction: !webKit && isRTL(source) ? 'rtl' : 'ltr',
          typeahead: false,
          wrap: true,
        },
        null,
        0,
      );
      return result.key === null ? undefined : options[Number(result.key)];
    },
    disconnect() {
      releaseRadioEntry();
      observer?.disconnect();
      observer = undefined;
      observed.clear();
      for (const [input, member] of members) {
        member.unlisten?.();
        updateIsolation(input, member, false, false);
        validity.remove(input);
      }
      members.clear();
      validity.disconnect();
      config = undefined;
      scope = undefined;
      controls = [];
      focused = undefined;
    },
  };
}

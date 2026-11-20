import packageJson from '../../../package.json' with { type: 'json' };
import { devWarningsEnabled } from '../devWarningsEnabled.js';
import {
  composedAncestors,
  composedContains,
  deepFocus,
  focusElement,
  lockDocumentScroll,
  watchSlotAssignments,
} from './dom.js';

type DismissReason = 'trigger' | 'escape' | 'cancel' | 'native' | 'lost';
type Phase = 'closed' | 'opening' | 'open' | 'exiting';

interface OverlayOptions {
  readonly element: HTMLElement;
  readonly trigger?: HTMLElement | null;
  readonly onOpenChange: (open: boolean, reason: DismissReason) => void;
}

type Registration =
  | (OverlayOptions & { readonly kind: 'auto' })
  | (OverlayOptions & { readonly kind: 'manual'; readonly passive?: boolean })
  | (OverlayOptions & {
      readonly kind: 'modal';
      readonly element: HTMLDialogElement;
      readonly isDismissGuarded?: () => boolean;
    });

interface OverlayHandle {
  setTrigger: (trigger: HTMLElement | null) => void;
  setOpen: (open: boolean) => void;
  requestOpen: () => void;
  beginExit: () => void;
  finishExit: () => void;
  dispose: () => void;
}

const runtimeName = `@docouno/unica@${packageJson.version}/OverlayRuntime`;
const versionsName = '@docouno/unica/OverlayRuntimeVersions';
const modalChange = `@docouno/unica@${packageJson.version}/modalchange`;

type Realm = Window & typeof globalThis;

function activeRuntime(view: Window): OverlayRuntime | undefined {
  return Reflect.get(view, Symbol.for(runtimeName)) as OverlayRuntime | undefined;
}

function inDocument(node: Element, document: Document): boolean {
  return node.isConnected && node.ownerDocument === document;
}

function isNativeOpen({ options }: Layer): boolean {
  const { element, kind } = options;
  return element.matches(kind === 'modal' ? ':modal' : ':popover-open');
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

let generatedId = 0;

class Layer {
  readonly document: Document;
  phase: Phase = 'closed';
  order = 0;
  runtime: OverlayRuntime | undefined;
  trigger: HTMLElement | null = null;
  dismissed = false;
  leased = false;
  moving = false;
  internal = false;
  disposed = false;
  focused = false;
  previousFocus: Element | null = null;
  private previousInert: boolean | undefined;
  private unbindTrigger: (() => void) | undefined;

  constructor(readonly options: Registration) {
    const { element, kind, trigger } = options;
    this.document = element.ownerDocument;
    if (kind !== 'modal') {
      element.popover = kind;
    }
    if (kind === 'auto' && !element.id) {
      const root = element.getRootNode();
      let id: string;
      do {
        id = `unica-overlay-${++generatedId}`;
      } while ('getElementById' in root && (root as Document | ShadowRoot).getElementById(id));
      element.id = id;
    }
    element.addEventListener('beforetoggle', this.beforeToggle);
    if (kind === 'modal') {
      element.addEventListener('close', this.onClose);
      element.addEventListener('cancel', this.onCancel);
    }
    this.setTrigger(trigger ?? null);
  }

  get active(): boolean {
    return this.phase === 'open';
  }

  get ownsCarrier(): boolean {
    return this.options.element.ownerDocument === this.document;
  }

  setTrigger = (trigger: HTMLElement | null): void => {
    if (this.disposed || this.trigger === trigger) {
      return;
    }
    const previous = this.trigger;
    this.unbindTrigger?.();
    this.unbindTrigger = undefined;
    this.trigger = trigger;
    if (trigger && this.options.kind === 'auto') {
      const target = trigger.getAttribute('popovertarget');
      const expanded = trigger.getAttribute('aria-expanded');
      trigger.addEventListener('click', this.onClick);
      this.unbindTrigger = () => {
        trigger.removeEventListener('click', this.onClick);
        if (trigger.ownerDocument === this.document) {
          restoreAttribute(trigger, 'popovertarget', target);
          restoreAttribute(trigger, 'aria-expanded', expanded);
        }
      };
      this.updateTrigger();
    }
    if (this.active || this.phase === 'exiting') {
      this.runtime?.watchTrigger(previous, trigger);
    }
  };

  updateTrigger(): void {
    const { trigger } = this;
    if (trigger?.ownerDocument === this.document && this.options.kind === 'auto') {
      restoreAttribute(
        trigger,
        'popovertarget',
        this.phase === 'exiting' || !this.ownsCarrier ? null : this.options.element.id,
      );
      trigger.setAttribute('aria-expanded', String(this.active));
    }
  }

  setOpen = (open: boolean): void => {
    if (this.disposed) {
      return;
    }
    this.runtime?.reconcile();
    if (!this.ownsCarrier) {
      return;
    }
    if (!open) {
      this.finishExit();
      return;
    }
    if (this.phase === 'closed' && !this.dismissed) {
      runtimeFor(this.document)?.open(this);
    }
  };

  requestOpen = (): void => {
    if (!this.disposed && this.ownsCarrier && this.phase !== 'exiting') {
      this.dismissed = false;
      this.options.onOpenChange(true, 'trigger');
    }
  };

  beginExit = (): void => {
    if (this.active && this.ownsCarrier) {
      this.phase = 'exiting';
      this.updateTrigger();
      this.previousInert = this.options.element.inert;
      this.options.element.inert = true;
      this.runtime?.publishModal();
    }
  };

  resetExit(): void {
    if (this.previousInert !== undefined) {
      if (this.ownsCarrier) {
        this.options.element.inert = this.previousInert;
      }
      this.previousInert = undefined;
    }
  }

  finishExit = (): void => {
    this.dismissed = false;
    this.runtime?.close(this);
  };

  dispose = (): void => {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    const { element } = this.options;
    this.unbindTrigger?.();
    element.removeEventListener('beforetoggle', this.beforeToggle);
    element.removeEventListener('close', this.onClose);
    element.removeEventListener('cancel', this.onCancel);
    this.runtime?.close(this);
  };

  show(): void {
    const { options, trigger } = this;
    this.operate(() => {
      if (options.kind === 'modal') {
        options.element.showModal();
      } else {
        options.element.showPopover(trigger ? { source: trigger } : undefined);
      }
    });
  }

  hide(): void {
    if (!this.ownsCarrier) {
      return;
    }
    const { options } = this;
    this.operate(() => {
      if (options.kind === 'modal') {
        // A disconnected or readmitted non-modal dialog can retain its open attribute.
        if (options.element.open) {
          options.element.close();
        }
      } else if (isNativeOpen(this)) {
        options.element.hidePopover();
      }
    });
  }

  private operate(operation: () => void): void {
    const previous = this.internal;
    this.internal = true;
    try {
      operation();
    } finally {
      this.internal = previous;
    }
  }

  private beforeToggle = (event: ToggleEvent): void => {
    if (!this.ownsCarrier || this.internal || this.moving || event.newState !== 'closed') {
      return;
    }
    if (this.options.kind === 'modal') {
      // beforetoggle fires before the browser clears :modal.
      queueMicrotask(() => this.runtime?.reconcile());
    } else {
      this.runtime?.nativeDismiss(this);
    }
  };

  private onClose = (): void => {
    this.runtime?.reconcile();
  };

  private onCancel = (event: Event): void => {
    if (!this.ownsCarrier || event.defaultPrevented || this.phase === 'closed') {
      return;
    }
    event.preventDefault();
    if (this.active) {
      this.options.onOpenChange(false, 'cancel');
    }
  };

  private onClick = (event: MouseEvent): void => {
    if (
      !this.ownsCarrier ||
      this.trigger?.ownerDocument !== this.document ||
      event.defaultPrevented
    ) {
      return;
    }
    event.preventDefault();
    this.runtime?.reconcile();
    if (this.active) {
      this.options.onOpenChange(false, 'trigger');
    } else {
      this.requestOpen();
    }
  };
}

interface Lease {
  readonly start: number;
  readonly popovers: readonly Layer[];
  readonly modal: Layer;
  readonly focus: Element | null;
}

class OverlayRuntime {
  private readonly pending = new Set<Layer>();
  private readonly deferredOpens = new Set<Layer>();
  private readonly stack: Layer[] = [];
  private readonly leases: Lease[] = [];
  private readonly resize: ResizeObserver;
  private readonly resizeTargets = new Map<Element, number>();
  private readonly mutations: MutationObserver;
  private readonly modalAncestors = new Set<Element>();
  private stopSlotChanges: (() => void) | undefined;
  private order = 0;
  private transactions = 0;
  private showing = 0;
  private needsSync = false;
  private moving = 0;
  private releaseScroll: (() => void) | undefined;
  private modalAncestry: Element[] = [];
  private pointerTarget: Element | null = null;
  private pointerTimeout: number | undefined;
  private pendingReports = 0;

  constructor(
    private readonly document: Document,
    private readonly view: Realm,
  ) {
    this.resize = new view.ResizeObserver(this.reconcile);
    this.mutations = new view.MutationObserver(this.onMutations);
    document.addEventListener('keydown', this.onEscape, true);
    document.addEventListener('focusin', this.onFocus, true);
    document.addEventListener('pointerdown', this.onPointer, true);
    document.addEventListener('pointerup', this.endPointer, true);
    document.addEventListener('pointercancel', this.endPointer, true);
    document.addEventListener('fullscreenchange', this.reconcile);
  }

  open(layer: Layer): void {
    this.transactions++;
    try {
      this.reconcile();
      if (layer.disposed || layer.phase !== 'closed' || layer.dismissed) {
        return;
      }
      if (this.showing) {
        // Chromium forbids nested showPopover calls, including from native autofocus.
        layer.runtime = this;
        this.deferredOpens.add(layer);
        return;
      }
      layer.previousFocus = deepFocus(this.document);
      layer.phase = 'opening';
      layer.runtime = this;
      this.pending.add(layer);
      if (layer.options.kind === 'modal') {
        this.acquireLease(layer);
      }
      if (!layer.disposed && layer.phase === 'opening' && this.alive(layer)) {
        this.show(layer);
        if (layer.runtime === this) {
          this.admit();
        } else if (!layer.runtime) {
          layer.hide();
        }
      }
    } finally {
      if (this.pending.has(layer)) {
        layer.hide();
        this.detach(layer);
      }
      this.completeTransaction();
    }
  }

  private show(layer: Layer): void {
    this.showing++;
    try {
      layer.show();
    } finally {
      this.showing--;
    }
  }

  close(layer: Layer): void {
    this.transactions++;
    try {
      const hadFocus = this.ownedFocus(layer);
      layer.beginExit();
      // A projection subscriber may synchronously dispose this layer.
      if (layer.runtime === this) {
        layer.hide();
        this.detach(layer);
        this.reconcile();
        if (hadFocus) {
          this.returnFocus(layer);
        }
      }
    } finally {
      this.completeTransaction();
    }
  }

  nativeDismiss(layer: Layer): void {
    if (layer.active || layer.phase === 'exiting') {
      this.finalDismiss(layer, 'native', true);
    }
  }

  resolveModal(): HTMLDialogElement | null {
    for (let index = this.stack.length - 1; index >= 0; index--) {
      const layer = this.stack[index]!;
      const { options } = layer;
      if (layer.active && options.kind === 'modal' && this.alive(layer) && isNativeOpen(layer)) {
        return options.element;
      }
    }
    return null;
  }

  publishModal(): void {
    const ancestry = Array.from(composedAncestors(this.resolveModal()));
    if (
      ancestry.length !== this.modalAncestry.length ||
      ancestry.some((ancestor, index) => ancestor !== this.modalAncestry[index])
    ) {
      this.modalAncestry = ancestry;
      this.document.dispatchEvent(new this.view.Event(modalChange));
    }
  }

  watchTrigger(previous: HTMLElement | null, current: HTMLElement | null): void {
    this.unobserve(previous);
    this.observe(current);
  }

  private observe(element: HTMLElement | null): void {
    if (element) {
      const count = this.resizeTargets.get(element) ?? 0;
      if (count === 0) {
        this.resize.observe(element, { box: 'border-box' });
      }
      this.resizeTargets.set(element, count + 1);
    }
  }

  private unobserve(element: HTMLElement | null): void {
    if (element) {
      const count = this.resizeTargets.get(element);
      if (count === 1) {
        this.resize.unobserve(element);
        this.resizeTargets.delete(element);
      } else if (count) {
        this.resizeTargets.set(element, count - 1);
      }
    }
  }

  private alive(layer: Layer): boolean {
    return (
      inDocument(layer.options.element, this.document) &&
      (!layer.trigger || inDocument(layer.trigger, this.document))
    );
  }

  private admit(): void {
    for (const layer of this.pending) {
      if (!this.alive(layer) || !isNativeOpen(layer)) {
        continue;
      }
      this.pending.delete(layer);
      layer.order = ++this.order;
      layer.phase = 'open';
      this.stack.push(layer);
      layer.updateTrigger();
      this.observe(layer.options.element);
      this.observe(layer.trigger);
      if (layer.options.kind === 'modal') {
        this.releaseScroll ??= lockDocumentScroll(this.document, this.view);
        this.watchModals();
      }
    }
  }

  private detach(layer: Layer): void {
    const index = this.stack.indexOf(layer);
    if (index >= 0) {
      this.stack.splice(index, 1);
      this.unobserve(layer.options.element);
      this.unobserve(layer.trigger);
    }
    this.pending.delete(layer);
    this.deferredOpens.delete(layer);
    layer.runtime = undefined;
    layer.phase = 'closed';
    layer.focused = false;
    layer.resetExit();
    if (layer.leased) {
      layer.leased = false;
      if (layer.ownsCarrier) {
        layer.options.element.popover = 'auto';
      }
    }
    if (!layer.disposed) {
      layer.updateTrigger();
    }
    if (index >= 0 && layer.options.kind === 'modal') {
      this.watchModals();
    }
  }

  reconcile = (): void => {
    this.admit();
    for (const layer of [...this.stack]) {
      if (layer.runtime !== this || layer.moving || layer.internal) {
        continue;
      }
      if (!this.alive(layer) || !isNativeOpen(layer)) {
        this.finalDismiss(layer, 'lost');
      }
    }
  };

  private watchModals(): void {
    this.mutations.disconnect();
    this.stopSlotChanges?.();
    this.stopSlotChanges = undefined;
    this.modalAncestors.clear();
    const roots = new Set<Node>();
    for (const { options } of this.stack) {
      if (options.kind !== 'modal') {
        continue;
      }
      this.mutations.observe(options.element, { attributes: true, attributeFilter: ['open'] });
      for (const ancestor of composedAncestors(options.element)) {
        this.modalAncestors.add(ancestor);
        roots.add(ancestor.getRootNode());
      }
    }
    for (const root of roots) {
      this.mutations.observe(root, { childList: true, subtree: true });
    }
    if (this.modalAncestors.size) {
      this.stopSlotChanges = watchSlotAssignments(this.modalAncestors, this.onAncestryChange);
    }
  }

  private onAncestryChange = (): void => {
    this.watchModals();
    this.reconcile();
    this.publishModal();
  };

  private onMutations = (records: MutationRecord[]): void => {
    const moved = records.some((record) =>
      Array.from(record.removedNodes).some((node) => this.modalAncestors.has(node as Element)),
    );
    if (moved) {
      // A state-preserving move can keep :modal while changing the structural owners.
      this.onAncestryChange();
    } else if (records.some(({ type }) => type === 'attributes')) {
      this.reconcile();
    }
  };

  private ownedFocus(layer: Layer): boolean {
    const focus = deepFocus(this.document);
    return (
      composedContains(layer.options.element, focus) ||
      ((focus === this.document.body || !focus) && layer.focused)
    );
  }

  private returnFocus(layer: Layer): void {
    const current = deepFocus(this.document);
    if (
      (current &&
        current !== this.document.body &&
        current !== layer.previousFocus &&
        !composedContains(layer.options.element, current)) ||
      (this.pointerTarget && !composedContains(layer.options.element, this.pointerTarget))
    ) {
      return;
    }
    focusElement(layer.trigger ?? layer.previousFocus, this.document);
  }

  private finalDismiss(layer: Layer, reason: DismissReason, browserClosing = false): void {
    const notify = layer.active;
    const hadFocus = notify && this.ownedFocus(layer);
    layer.dismissed = true;
    this.transactions++;
    try {
      if (!browserClosing) {
        layer.hide();
      }
      this.detach(layer);
      if (notify) {
        this.pendingReports++;
        queueMicrotask(() => {
          this.pendingReports--;
          try {
            if (!layer.disposed) {
              if (hadFocus && layer.phase === 'closed') {
                this.returnFocus(layer);
              }
              layer.options.onOpenChange(false, reason);
            }
          } finally {
            this.finishIdle();
          }
        });
      }
    } finally {
      this.completeTransaction();
    }
  }

  private acquireLease(modal: Layer): void {
    const retained = this.stack.findLastIndex(
      (layer) =>
        layer.options.kind === 'auto' &&
        !layer.leased &&
        composedContains(layer.options.element, modal.options.element),
    );
    const first = this.stack.findIndex(
      (layer, index) =>
        index > retained && layer.active && layer.options.kind === 'auto' && !layer.leased,
    );
    if (first < 0) {
      return;
    }
    const interval = this.stack.slice(first).filter(({ options }) => options.kind !== 'modal');
    const popovers = interval.filter(
      (layer) => layer.active && layer.options.kind === 'auto' && !layer.leased,
    );
    this.leases.push({ start: interval[0]!.order, popovers, modal, focus: modal.previousFocus });
    const promoted = new Set(popovers);
    this.replay(interval, promoted, true);
  }

  private resumeLeases(): void {
    const ready = this.leases.filter(
      ({ modal, start }) =>
        modal.runtime !== this &&
        !this.stack.some((layer) => layer.options.kind === 'modal' && layer.order > start),
    );
    if (!ready.length) {
      return;
    }
    const start = Math.min(...ready.map((lease) => lease.start));
    const restored = new Set(ready.flatMap((lease) => lease.popovers));
    for (const lease of ready) {
      this.leases.splice(this.leases.indexOf(lease), 1);
    }
    const focused = deepFocus(this.document);
    const interval = this.stack.filter(
      (layer) => layer.order >= start && layer.options.kind !== 'modal',
    );
    this.replay(interval, restored, false);

    const current = deepFocus(this.document);
    const focusWasInInterval = interval.some(({ options }) =>
      composedContains(options.element, focused),
    );
    if (!focused || focused === this.document.body || focusWasInInterval) {
      const original = ready[0]!.focus;
      if (focusWasInInterval || current === this.document.body) {
        focusElement(focusWasInInterval ? focused : original, this.document);
      }
    }
  }

  private replay(interval: Layer[], changed: Set<Layer>, leased: boolean): void {
    this.moving++;
    for (const layer of interval) {
      layer.moving = true;
    }
    try {
      for (const layer of [...interval].reverse()) {
        layer.hide();
      }
      for (const layer of interval) {
        if (layer.runtime !== this) {
          continue;
        }
        if (!this.alive(layer)) {
          this.finalDismiss(layer, 'lost');
          continue;
        }
        if (changed.has(layer)) {
          layer.leased = leased;
          layer.options.element.popover = leased ? 'manual' : 'auto';
        }
        if (
          !Array.from(composedAncestors(layer.options.element)).some((element) =>
            element.matches('dialog:not([open])'),
          )
        ) {
          try {
            this.show(layer);
          } catch {
            // A consumer may invalidate the carrier synchronously before admission.
          }
        }
        if (!isNativeOpen(layer)) {
          this.finalDismiss(layer, 'lost');
        }
      }
    } finally {
      for (const layer of interval) {
        layer.moving = false;
      }
      this.moving--;
    }
  }

  private completeTransaction(): void {
    this.needsSync = true;
    if (--this.transactions === 0) {
      // Replaying a layer can synchronously admit or close another layer.
      this.transactions++;
      try {
        while (this.needsSync) {
          this.needsSync = false;
          this.resumeLeases();
          this.reconcile();
          if (this.releaseScroll && !this.stack.some(({ options }) => options.kind === 'modal')) {
            this.releaseScroll();
            this.releaseScroll = undefined;
          }
          this.publishModal();
          for (const layer of this.deferredOpens) {
            this.deferredOpens.delete(layer);
            this.open(layer);
          }
        }
      } finally {
        this.transactions--;
        this.finishIdle();
      }
    }
  }

  private onFocus = (event: FocusEvent): void => {
    this.admit();
    if (!this.moving) {
      const target = event.composedPath()[0] as Element;
      for (const layer of this.stack) {
        layer.focused = composedContains(layer.options.element, target);
      }
    }
  };

  private onPointer = (event: PointerEvent): void => {
    this.view.clearTimeout(this.pointerTimeout);
    this.pointerTarget = event.composedPath()[0] as Element;
  };

  private endPointer = (): void => {
    this.view.clearTimeout(this.pointerTimeout);
    this.pointerTimeout = this.view.setTimeout(() => {
      this.pointerTarget = null;
    }, 0);
  };

  private onEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
      return;
    }
    this.pointerTarget = null;
    this.reconcile();
    const barrier = this.stack.findLast(({ options }) => options.kind === 'modal');
    const layer = this.stack.findLast((entry) => {
      const { options } = entry;
      return (
        entry.active &&
        (options.kind !== 'manual' || !options.passive) &&
        (!barrier ||
          entry === barrier ||
          composedContains(barrier.options.element, options.element))
      );
    });
    const candidate = layer ?? barrier;
    if (!candidate) {
      return;
    }
    const focus = deepFocus(this.document);
    const own = new Set(this.stack.map(({ options }) => options.element as Element));
    for (const node of [...event.composedPath(), ...composedAncestors(focus)]) {
      if (node && 'nodeType' in node && node.nodeType === 1) {
        const element = node as Element;
        if (
          element.matches(':popover-open, :modal') &&
          !own.has(element) &&
          !composedContains(element, candidate.options.element)
        ) {
          // Foreign manual popovers have no native Escape watcher of their own.
          if (
            element.matches(':popover-open') &&
            'popover' in element &&
            element.popover === 'manual'
          ) {
            event.preventDefault();
          }
          return;
        }
      }
    }
    if (!layer) {
      event.preventDefault();
      return;
    }
    if (layer.options.kind === 'auto' && !layer.leased) {
      if (
        barrier?.active &&
        barrier.options.kind === 'modal' &&
        barrier.options.isDismissGuarded?.()
      ) {
        event.preventDefault();
        this.finalDismiss(layer, 'escape');
      }
      return;
    }
    event.preventDefault();
    layer.options.onOpenChange(false, 'escape');
  };

  private finishIdle(): void {
    if (this.stack.length || this.pending.size || this.transactions || this.pendingReports) {
      return;
    }
    this.resize.disconnect();
    this.mutations.disconnect();
    this.stopSlotChanges?.();
    this.view.clearTimeout(this.pointerTimeout);
    this.document.removeEventListener('keydown', this.onEscape, true);
    this.document.removeEventListener('focusin', this.onFocus, true);
    this.document.removeEventListener('pointerdown', this.onPointer, true);
    this.document.removeEventListener('pointerup', this.endPointer, true);
    this.document.removeEventListener('pointercancel', this.endPointer, true);
    this.document.removeEventListener('fullscreenchange', this.reconcile);
    if (activeRuntime(this.view) !== this) {
      return;
    }
    Reflect.deleteProperty(this.view, Symbol.for(runtimeName));
    const versionsKey = Symbol.for(versionsName);
    const versions = Reflect.get(this.view, versionsKey) as Set<string> | undefined;
    versions?.delete(packageJson.version);
    if (!versions?.size) {
      Reflect.deleteProperty(this.view, versionsKey);
    }
  }
}

function runtimeFor(document: Document): OverlayRuntime | undefined {
  const view = document.defaultView;
  if (!view) {
    return undefined;
  }
  const current = activeRuntime(view);
  if (current) {
    return current;
  }
  const versionsKey = Symbol.for(versionsName);
  const versions = (Reflect.get(view, versionsKey) as Set<string> | undefined) ?? new Set<string>();
  if (versions.size && devWarningsEnabled()) {
    console.warn('Unica overlay runtimes from different package versions share a document.');
  }
  const runtime = new OverlayRuntime(document, view);
  versions.add(packageJson.version);
  Reflect.set(view, versionsKey, versions);
  Reflect.set(view, Symbol.for(runtimeName), runtime);
  return runtime;
}

/** Register a carrier in its owner document. Re-register if that document changes. */
export function registerOverlay(options: Registration): OverlayHandle {
  return new Layer(options);
}

export function resolveToastPortalHost(container: HTMLElement | null): HTMLElement | null {
  if (!container) {
    return null;
  }
  const document = container.ownerDocument;
  const view = document.defaultView;
  const modal = view && activeRuntime(view)?.resolveModal();
  if (!modal) {
    return container;
  }
  return container === document.body || composedContains(container, modal) ? modal : null;
}

export function subscribeToModalChanges(document: Document, notify: () => void): () => void {
  document.addEventListener(modalChange, notify);
  return () => document.removeEventListener(modalChange, notify);
}

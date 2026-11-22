import { devWarningsEnabled } from '../devWarningsEnabled.js';
import {
  OVERLAY_RUNTIME_KEY,
  deleteFallbackOverlayRuntime,
  resolveOverlayRuntime,
  setFallbackOverlayRuntime,
} from '../overlay-protocol.js';
import type { OverlayRuntimeProtocol } from '../overlay-protocol.js';
import { PACKAGE_VERSION } from '../version.js';
import {
  addListener,
  bindPopoverInvoker,
  closeDialog,
  composedAncestors,
  composedContains,
  deepFocus,
  dispatchTargetEvent,
  documentBodyOf,
  elementFromTarget,
  focusElement,
  getElementInert,
  getElementPopover,
  hasHiddenAncestor,
  hasShadowRoot,
  hideElementPopover,
  isConnectedNode,
  isDialogOpen,
  isElement,
  liveViewOf,
  lockDocumentScroll,
  matchesSelector,
  ownerDocumentOf,
  parentNodeOf,
  removeListener,
  setElementInert,
  setElementPopover,
  setPopoverInvokerTarget,
  showDialogModal,
  showElementPopover,
} from './dom.js';

export type DismissReason = 'trigger' | 'escape' | 'cancel' | 'native' | 'lost';
type Phase = 'closed' | 'opening' | 'open' | 'exiting';

export interface CloseOptions {
  readonly returnFocus?: boolean | undefined;
}

export interface OverlayUpdate {
  readonly trigger?: HTMLElement | null | undefined;
  readonly passive?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean, reason: DismissReason) => void) | undefined;
}

export interface OverlayOptions {
  readonly element: HTMLElement;
  readonly trigger?: HTMLElement | null | undefined;
  readonly onOpenChange: (open: boolean, reason: DismissReason) => void;
}

export type Registration =
  | (OverlayOptions & { readonly kind: 'auto' })
  | (OverlayOptions & { readonly kind: 'manual'; readonly passive?: boolean | undefined })
  | (OverlayOptions & { readonly kind: 'modal'; readonly element: HTMLDialogElement });

export interface OverlayHandle {
  update: (patch: OverlayUpdate) => void;
  setTrigger: (trigger: HTMLElement | null) => void;
  setOpen: (open: boolean, options?: CloseOptions) => void;
  requestOpen: () => void;
  beginExit: () => void;
  finishExit: (options?: CloseOptions) => void;
  dispose: () => void;
}

const RUNTIME_PROTOCOL = 1;
const MAX_SYNC_PASSES = 64;
const SUPPRESS_CLICK_TIMEOUT_MS = 500;
const versionsKey = Symbol.for('@docouno/unica/OverlayRuntimeVersions');
const triggerRegistryKey = Symbol.for(`@docouno/unica/OverlayTriggerRegistry@${RUNTIME_PROTOCOL}`);
const modalChange = `@docouno/unica/modalchange@${RUNTIME_PROTOCOL}`;

type Realm = Window & typeof globalThis;

interface TriggerEntry {
  readonly triggerPathIndex: (path: readonly EventTarget[]) => number;
  readonly handleTriggerClick: (event: MouseEvent) => void;
}

interface TriggerRegistry {
  readonly protocol: 1;
  readonly entries: Set<TriggerEntry>;
  readonly add: (entry: TriggerEntry) => void;
  readonly delete: (entry: TriggerEntry) => void;
  readonly dispose: () => void;
}

const joinedRuntimes = new WeakSet<OverlayRuntimeProtocol>();
const fallbackTriggerRegistries = new WeakMap<Document, TriggerRegistry>();
const foreignEscapes = new WeakMap<KeyboardEvent, 'manual' | 'other'>();

function isVersionSet(value: unknown): value is Set<string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'add' in value &&
    typeof (value as Set<string>).add === 'function' &&
    'delete' in value &&
    typeof (value as Set<string>).delete === 'function' &&
    'has' in value &&
    typeof (value as Set<string>).has === 'function'
  );
}

function isTriggerRegistryLike(value: unknown): value is TriggerRegistry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entries: unknown = Reflect.get(value, 'entries');
  return (
    Reflect.get(value, 'protocol') === 1 &&
    typeof entries === 'object' &&
    entries !== null &&
    typeof Reflect.get(entries, 'size') === 'number' &&
    typeof Reflect.get(entries, Symbol.iterator) === 'function' &&
    typeof Reflect.get(value, 'add') === 'function' &&
    typeof Reflect.get(value, 'delete') === 'function' &&
    typeof Reflect.get(value, 'dispose') === 'function'
  );
}

function resolveTriggerRegistry(document: Document): TriggerRegistry | undefined {
  try {
    const candidate: unknown = Reflect.get(document, triggerRegistryKey);
    if (isTriggerRegistryLike(candidate)) {
      return candidate;
    }
  } catch {
    // Fall back when the document host forbids symbol lookup.
  }
  return fallbackTriggerRegistries.get(document);
}

function createTriggerRegistry(document: Document): TriggerRegistry {
  const entries = new Set<TriggerEntry>();
  let disposed = false;

  const onDocumentClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !entries.size) {
      return;
    }
    const path = event.composedPath();
    let nearest: TriggerEntry | undefined;
    let nearestIndex = Number.POSITIVE_INFINITY;
    for (const entry of entries) {
      const index = entry.triggerPathIndex(path);
      if (index >= 0 && index < nearestIndex) {
        nearest = entry;
        nearestIndex = index;
      }
    }
    nearest?.handleTriggerClick(event);
  };

  addListener(document, 'click', onDocumentClick);

  const registry: TriggerRegistry = {
    protocol: 1,
    entries,
    add(entry) {
      if (!disposed) {
        entries.add(entry);
      }
    },
    delete(entry) {
      entries.delete(entry);
      if (!entries.size) {
        registry.dispose();
      }
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      entries.clear();
      removeListener(document, 'click', onDocumentClick);
      if (fallbackTriggerRegistries.get(document) === registry) {
        fallbackTriggerRegistries.delete(document);
      }
      try {
        if (Reflect.get(document, triggerRegistryKey) === registry) {
          Reflect.deleteProperty(document, triggerRegistryKey);
        }
      } catch {
        // Ignore restricted document proxies on teardown.
      }
    },
  };

  let stored = false;
  try {
    if (Reflect.get(document, triggerRegistryKey) === undefined) {
      stored = Reflect.set(document, triggerRegistryKey, registry);
    }
  } catch {
    stored = false;
  }
  if (!stored) {
    fallbackTriggerRegistries.set(document, registry);
  }
  return registry;
}

function registerTriggerClick(document: Document, entry: TriggerEntry): () => void {
  const registry = resolveTriggerRegistry(document) ?? createTriggerRegistry(document);
  registry.add(entry);
  return () => {
    registry.delete(entry);
  };
}

function inDocument(node: Element, document: Document): boolean {
  return isConnectedNode(node) && ownerDocumentOf(node) === document;
}

function isNativeOpen({ options }: Layer): boolean {
  return matchesSelector(options.element, options.kind === 'modal' ? ':modal' : ':popover-open');
}

function isZeroResize(entry: ResizeObserverEntry): boolean {
  const box = entry.borderBoxSize?.[0];
  if (box) {
    return box.inlineSize === 0 && box.blockSize === 0;
  }
  return entry.contentRect.width === 0 && entry.contentRect.height === 0;
}

class Layer {
  readonly document: Document;
  phase: Phase = 'closed';
  runtime: OverlayRuntime | undefined;
  trigger: HTMLElement | null = null;
  observedTrigger: HTMLElement | null = null;
  passive: boolean;
  onOpenChange: (open: boolean, reason: DismissReason) => void;
  dismissed = false;
  dismissPending = false;
  internal = false;
  disposed = false;
  focused = false;
  previousFocus: WeakRef<Element> | null = null;
  private suppressNextTriggerClick = false;
  private cancelSuppressClick: (() => void) | undefined;
  private previousInert: boolean | undefined;
  private openRevision = 0;
  private pendingOpenRequest = false;
  private unbindTrigger: (() => void) | undefined;

  constructor(readonly options: Registration) {
    const { element, kind, trigger, onOpenChange } = options;
    const owner = ownerDocumentOf(element);
    if (!owner) {
      throw new Error('Overlay carrier must belong to a Document.');
    }
    this.document = owner;
    this.passive = kind === 'manual' ? Boolean(options.passive) : false;
    this.onOpenChange = onOpenChange;
    if (kind !== 'modal') {
      setElementPopover(element, kind);
    }
    addListener(element, 'beforetoggle', this.beforeToggle);
    if (kind === 'modal') {
      addListener(element, 'close', this.onClose);
      addListener(element, 'cancel', this.onCancel);
    }
    this.setTrigger(trigger ?? null);
  }

  get active(): boolean {
    return this.phase === 'open';
  }

  get ownsCarrier(): boolean {
    return ownerDocumentOf(this.options.element) === this.document;
  }

  update = (patch: OverlayUpdate): void => {
    if (this.disposed) {
      return;
    }
    if (patch.onOpenChange !== undefined) {
      this.onOpenChange = patch.onOpenChange;
    }
    if ('passive' in patch && this.options.kind === 'manual') {
      this.passive = Boolean(patch.passive);
    }
    if ('trigger' in patch) {
      this.setTrigger(patch.trigger ?? null);
    }
  };

  setTrigger = (trigger: HTMLElement | null): void => {
    if (this.disposed || this.trigger === trigger) {
      return;
    }
    this.unbindTrigger?.();
    this.unbindTrigger = undefined;
    this.clearSuppressTriggerClick();
    this.trigger = trigger;
    const sameDocument = trigger !== null && ownerDocumentOf(trigger) === this.document;
    if (sameDocument && this.options.kind === 'auto') {
      const restoreInvoker = bindPopoverInvoker(
        trigger,
        this.phase === 'exiting' || !this.ownsCarrier ? null : this.options.element,
      );
      const unregisterClick = registerTriggerClick(this.document, this);
      this.unbindTrigger = () => {
        unregisterClick();
        if (ownerDocumentOf(trigger) === this.document) {
          restoreInvoker?.();
        }
      };
    }
    if (this.options.kind !== 'modal' && (this.active || this.phase === 'exiting')) {
      const nextObserved = sameDocument ? trigger : null;
      if (this.observedTrigger !== nextObserved) {
        this.runtime?.watchTrigger(this.observedTrigger, nextObserved);
        this.observedTrigger = nextObserved;
      }
    }
  };

  updateTrigger(): void {
    const { trigger } = this;
    if (
      trigger &&
      this.unbindTrigger &&
      ownerDocumentOf(trigger) === this.document &&
      this.options.kind === 'auto'
    ) {
      setPopoverInvokerTarget(
        trigger,
        this.phase === 'exiting' || !this.ownsCarrier ? null : this.options.element,
      );
    }
  }

  setOpen = (open: boolean, options?: CloseOptions): void => {
    this.commitOpen(open, ++this.openRevision, options);
  };

  private commitOpen(open: boolean, revision: number, options?: CloseOptions): void {
    if (this.disposed || revision !== this.openRevision) {
      return;
    }
    this.runtime?.reconcile();
    if (!this.ownsCarrier || revision !== this.openRevision) {
      return;
    }
    if (!open) {
      this.finishExit(options);
      return;
    }
    if (this.phase === 'exiting') {
      if (!this.dismissed && this.runtime?.cancelExit(this)) {
        return;
      }
      this.runtime?.close(this, { returnFocus: false });
      if (this.disposed || revision !== this.openRevision) {
        return;
      }
    }
    if (this.phase === 'closed' && !this.dismissed) {
      if (this.dismissPending) {
        queueMicrotask(() => this.commitOpen(true, revision));
      } else {
        runtimeFor(this.document)?.open(this);
      }
    }
  }

  requestOpen = (): void => {
    if (this.disposed || !this.ownsCarrier || this.phase === 'exiting') {
      return;
    }
    if (this.dismissPending) {
      if (!this.pendingOpenRequest) {
        this.pendingOpenRequest = true;
        // Native beforetoggle completes before the dismissal report and the next request.
        queueMicrotask(() => {
          this.pendingOpenRequest = false;
          this.requestOpen();
        });
      }
      return;
    }
    this.dismissed = false;
    this.onOpenChange(true, 'trigger');
  };

  beginExit = (): void => {
    if (this.active && this.ownsCarrier) {
      this.phase = 'exiting';
      this.updateTrigger();
      this.previousInert = getElementInert(this.options.element);
      setElementInert(this.options.element, true);
      this.runtime?.publishModal();
    }
  };

  resetExit(): void {
    if (this.previousInert !== undefined) {
      if (this.ownsCarrier) {
        setElementInert(this.options.element, this.previousInert);
      }
      this.previousInert = undefined;
    }
  }

  finishExit = (options?: CloseOptions): void => {
    this.openRevision++;
    this.dismissed = false;
    this.runtime?.close(this, options);
  };

  dispose = (): void => {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.openRevision++;
    const { element } = this.options;
    this.unbindTrigger?.();
    this.unbindTrigger = undefined;
    this.clearSuppressTriggerClick();
    removeListener(element, 'beforetoggle', this.beforeToggle);
    removeListener(element, 'close', this.onClose);
    removeListener(element, 'cancel', this.onCancel);
    this.runtime?.close(this);
    this.trigger = null;
    this.previousFocus = null;
  };

  armSuppressTriggerClick(view: Realm | null): void {
    this.clearSuppressTriggerClick();
    this.suppressNextTriggerClick = true;
    const clear = (): void => this.clearSuppressTriggerClick();
    addListener(this.document, 'pointerdown', clear, true);
    addListener(this.document, 'keydown', clear, true);
    const timer = view?.setTimeout(clear, SUPPRESS_CLICK_TIMEOUT_MS);
    this.cancelSuppressClick = () => {
      removeListener(this.document, 'pointerdown', clear, true);
      removeListener(this.document, 'keydown', clear, true);
      if (view && timer !== undefined && liveViewOf(this.document) === view) {
        try {
          view.clearTimeout(timer);
        } catch {
          // Ignore detached frame teardown.
        }
      }
    };
  }

  clearSuppressTriggerClick(): void {
    this.suppressNextTriggerClick = false;
    this.cancelSuppressClick?.();
    this.cancelSuppressClick = undefined;
  }

  show(): void {
    const { options, trigger } = this;
    this.operate(() => {
      if (options.kind === 'modal') {
        showDialogModal(options.element);
      } else {
        showElementPopover(
          options.element,
          options.kind === 'auto' && trigger ? trigger : undefined,
        );
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
        if (isDialogOpen(options.element)) {
          closeDialog(options.element);
        }
      } else if (isNativeOpen(this)) {
        hideElementPopover(options.element);
      }
    });
  }

  triggerPathIndex(path: readonly EventTarget[]): number {
    const { trigger } = this;
    if (
      this.disposed ||
      !trigger ||
      !this.ownsCarrier ||
      !isConnectedNode(trigger) ||
      ownerDocumentOf(trigger) !== this.document
    ) {
      return -1;
    }
    return path.indexOf(trigger);
  }

  handleTriggerClick(event: MouseEvent): void {
    event.preventDefault();
    this.runtime?.reconcile();
    if (this.suppressNextTriggerClick) {
      this.clearSuppressTriggerClick();
      return;
    }
    if (this.active) {
      this.onOpenChange(false, 'trigger');
    } else if (
      this.trigger &&
      isConnectedNode(this.trigger) &&
      ownerDocumentOf(this.trigger) === this.document
    ) {
      this.requestOpen();
    }
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
    if (!this.ownsCarrier || this.internal || event.newState !== 'closed') {
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
      this.onOpenChange(false, 'cancel');
    }
  };
}

class OverlayRuntime implements OverlayRuntimeProtocol {
  private readonly pending = new Set<Layer>();
  private readonly deferredOpens = new Set<Layer>();
  private readonly stack: Layer[] = [];
  private readonly resize: ResizeObserver;
  private readonly resizeTargets = new Map<Element, number>();
  private readonly mutations: MutationObserver;
  private readonly modalAncestors = new Set<Element>();
  private readonly registeredVersions = new Set<string>();
  private readonly viewRef: Realm;
  private transactions = 0;
  private showing = 0;
  private needsSync = false;
  private releaseScroll: (() => void) | undefined;
  private modalAncestry: Element[] = [];
  private pointerTarget: Element | null = null;
  private pointerTimeout: number | undefined;
  private pendingReports = 0;

  constructor(
    private readonly document: Document,
    view: Realm,
  ) {
    this.viewRef = view;
    this.resize = new view.ResizeObserver(this.onResize);
    this.mutations = new view.MutationObserver(this.onMutations);
    addListener(document, 'keydown', this.onEscapeCapture, true);
    addListener(document, 'keydown', this.onEscape);
    addListener(document, 'focusin', this.onFocus, true);
    addListener(document, 'pointerdown', this.onPointer, true);
    addListener(document, 'pointerup', this.endPointer, true);
    addListener(document, 'pointercancel', this.endPointer, true);
    addListener(document, 'contextmenu', this.clearPointer, true);
    addListener(document, 'fullscreenchange', this.reconcile);
    addListener(view, 'blur', this.clearPointer);
  }

  trackVersion(version: string): void {
    this.registeredVersions.add(version);
  }

  isTrackedModal(dialog: Element): boolean {
    for (let index = this.stack.length - 1; index >= 0; index--) {
      const layer = this.stack[index]!;
      if (layer.options.kind === 'modal' && layer.options.element === dialog) {
        return true;
      }
    }
    return false;
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
      const activeFocus = deepFocus(this.document);
      layer.previousFocus = activeFocus ? new WeakRef(activeFocus) : null;
      layer.phase = 'opening';
      layer.runtime = this;
      this.pending.add(layer);
      if (!layer.disposed && layer.phase === 'opening' && this.alive(layer)) {
        try {
          this.show(layer);
        } catch {
          // InvalidStateError or consumer-invalidated carriers roll back cleanly below.
        }
        if (layer.runtime === this) {
          this.admit();
        } else if (!layer.runtime) {
          layer.hide();
        }
      }
    } finally {
      try {
        if (this.pending.has(layer)) {
          const notifyLost = !layer.disposed;
          layer.hide();
          this.detach(layer);
          if (notifyLost) {
            this.reportDismiss(layer, 'lost', false, null);
          }
        }
      } finally {
        this.completeTransaction();
      }
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

  cancelExit(layer: Layer): boolean {
    if (layer.phase !== 'exiting' || layer.runtime !== this) {
      return false;
    }
    if (!this.alive(layer) || !isNativeOpen(layer)) {
      return false;
    }
    layer.phase = 'open';
    layer.resetExit();
    layer.updateTrigger();
    this.publishModal();
    return true;
  }

  close(layer: Layer, options?: CloseOptions): void {
    this.transactions++;
    try {
      const shouldReturnFocus = options?.returnFocus !== false;
      const hadFocus = shouldReturnFocus && this.ownedFocus(layer);
      const previousFocus = layer.previousFocus?.deref() ?? null;
      layer.beginExit();
      // A projection subscriber may synchronously dispose this layer.
      if (layer.runtime === this) {
        layer.hide();
        this.detach(layer);
        this.reconcile();
        if (hadFocus) {
          this.returnFocus(layer, previousFocus);
        }
      }
    } finally {
      this.completeTransaction();
    }
  }

  nativeDismiss(layer: Layer): void {
    if (layer.active || layer.phase === 'exiting') {
      if (
        layer.options.kind === 'auto' &&
        layer.trigger &&
        this.pointerTarget &&
        composedContains(layer.trigger, this.pointerTarget)
      ) {
        layer.armSuppressTriggerClick(this.liveView());
      }
      this.finalDismiss(layer, 'native', true);
      if (this.stack.length) {
        // beforetoggle fires before the browser clears :popover-open on the closing layer.
        queueMicrotask(() => this.reconcile());
      }
    }
  }

  resolveModal(physical = false): HTMLDialogElement | null {
    if (physical) {
      // showModal dispatches blur and focus before focusin admits the opening layer.
      // Reentrant opens are deferred, so at most one pending layer is natively open.
      for (const layer of this.pending) {
        if (
          layer.options.kind === 'modal' &&
          inDocument(layer.options.element, this.document) &&
          isNativeOpen(layer)
        ) {
          return layer.options.element;
        }
      }
    }
    for (let index = this.stack.length - 1; index >= 0; index--) {
      const layer = this.stack[index]!;
      const { options } = layer;
      if (options.kind !== 'modal' || !isNativeOpen(layer)) {
        continue;
      }
      if (
        physical ? inDocument(options.element, this.document) : layer.active && this.alive(layer)
      ) {
        return options.element;
      }
    }
    return null;
  }

  publishModal(): void {
    const view = this.liveView();
    if (!view) {
      return;
    }
    const ancestry = Array.from(composedAncestors(this.resolveModal()));
    if (this.hasModalAncestryChanged(ancestry)) {
      this.modalAncestry = ancestry;
      dispatchTargetEvent(this.document, new view.Event(modalChange));
    }
  }

  watchTrigger(previous: HTMLElement | null, current: HTMLElement | null): void {
    this.unobserve(previous);
    this.observe(current);
  }

  private liveView(): Realm | null {
    const view = liveViewOf(this.document);
    return view === this.viewRef ? view : null;
  }

  private hasModalAncestryChanged(ancestry: readonly Element[]): boolean {
    return (
      ancestry.length !== this.modalAncestry.length ||
      ancestry.some((ancestor, index) => ancestor !== this.modalAncestry[index])
    );
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
    if (!this.liveView()) {
      return false;
    }
    const { element, kind } = layer.options;
    if (!inDocument(element, this.document) || hasHiddenAncestor(element, false)) {
      return false;
    }
    if (kind !== 'modal' && layer.trigger) {
      if (!inDocument(layer.trigger, this.document) || hasHiddenAncestor(layer.trigger, true)) {
        return false;
      }
    }
    return true;
  }

  private admit(): void {
    for (const layer of this.pending) {
      if (!this.alive(layer) || !isNativeOpen(layer)) {
        continue;
      }
      this.pending.delete(layer);
      layer.clearSuppressTriggerClick();
      layer.phase = 'open';
      this.stack.push(layer);
      layer.updateTrigger();
      this.observe(layer.options.element);
      if (layer.options.kind !== 'modal' && layer.trigger) {
        layer.observedTrigger = layer.trigger;
        this.observe(layer.trigger);
      }
      if (layer.options.kind === 'modal') {
        this.releaseScroll ??= lockDocumentScroll(this.document);
        this.watchModals();
      }
    }
  }

  private detach(layer: Layer): void {
    const index = this.stack.indexOf(layer);
    if (index >= 0) {
      this.stack.splice(index, 1);
      this.unobserve(layer.options.element);
      if (layer.observedTrigger) {
        this.unobserve(layer.observedTrigger);
      }
    }
    layer.observedTrigger = null;
    this.pending.delete(layer);
    this.deferredOpens.delete(layer);
    layer.runtime = undefined;
    layer.phase = 'closed';
    layer.focused = false;
    layer.previousFocus = null;
    layer.resetExit();
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
      if (layer.runtime !== this || layer.internal) {
        continue;
      }
      if (!this.alive(layer) || !isNativeOpen(layer)) {
        this.finalDismiss(layer, 'lost');
      }
    }
  };

  private onResize = (entries: ResizeObserverEntry[]): void => {
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]!;
      if (
        isZeroResize(entry) ||
        !isConnectedNode(entry.target) ||
        ownerDocumentOf(entry.target) !== this.document
      ) {
        this.reconcile();
        return;
      }
    }
  };

  private watchModals(): void {
    this.mutations.disconnect();
    this.modalAncestors.clear();
    const observedParents = new Set<ParentNode>();
    for (const { options } of this.stack) {
      if (options.kind !== 'modal') {
        continue;
      }
      this.mutations.observe(options.element, { attributes: true, attributeFilter: ['open'] });
      for (const ancestor of composedAncestors(options.element)) {
        this.modalAncestors.add(ancestor);
        const parent = parentNodeOf(ancestor);
        if (parent && !observedParents.has(parent)) {
          observedParents.add(parent);
          this.mutations.observe(parent, { childList: true });
        }
      }
    }
  }

  private onMutations = (records: MutationRecord[]): void => {
    let relevant = false;
    for (let index = 0; index < records.length; index++) {
      const record = records[index]!;
      if (record.type === 'attributes') {
        relevant = true;
        break;
      }
      const { removedNodes } = record;
      for (let nodeIndex = 0; nodeIndex < removedNodes.length; nodeIndex++) {
        if (this.modalAncestors.has(removedNodes[nodeIndex] as Element)) {
          relevant = true;
          break;
        }
      }
      if (relevant) {
        break;
      }
    }
    if (relevant) {
      this.reconcile();
      this.publishModal();
      if (this.stack.some(({ options }) => options.kind === 'modal')) {
        this.watchModals();
      }
    }
  };

  private ownedFocus(layer: Layer): boolean {
    const focus = deepFocus(this.document);
    return (
      composedContains(layer.options.element, focus) ||
      ((focus === documentBodyOf(this.document) || !focus) && layer.focused)
    );
  }

  private returnFocus(layer: Layer, previousFocus: Element | null): void {
    const current = deepFocus(this.document);
    if (
      (current &&
        current !== documentBodyOf(this.document) &&
        current !== previousFocus &&
        !composedContains(layer.options.element, current)) ||
      (this.pointerTarget && !composedContains(layer.options.element, this.pointerTarget))
    ) {
      return;
    }
    if (!focusElement(layer.trigger, this.document)) {
      focusElement(previousFocus, this.document);
    }
  }

  private reportDismiss(
    layer: Layer,
    reason: DismissReason,
    hadFocus: boolean,
    previousFocus: Element | null,
  ): void {
    layer.dismissed = true;
    layer.dismissPending = true;
    this.pendingReports++;
    queueMicrotask(() => {
      try {
        if (!layer.disposed) {
          if (hadFocus && layer.phase === 'closed') {
            try {
              this.returnFocus(layer, previousFocus);
            } catch (error) {
              this.liveView()?.reportError(error);
            }
          }
          layer.onOpenChange(false, reason);
        }
      } finally {
        layer.dismissPending = false;
        this.pendingReports--;
        this.finishIdle();
      }
    });
  }

  private finalDismiss(layer: Layer, reason: DismissReason, browserClosing = false): void {
    const wasActive = layer.active;
    const hadFocus = (wasActive || layer.phase === 'exiting') && this.ownedFocus(layer);
    const previousFocus = layer.previousFocus?.deref() ?? null;
    this.transactions++;
    try {
      if (wasActive) {
        this.reportDismiss(layer, reason, hadFocus, previousFocus);
      } else if (hadFocus) {
        this.pendingReports++;
        queueMicrotask(() => {
          try {
            if (!layer.disposed && layer.phase === 'closed') {
              this.returnFocus(layer, previousFocus);
            }
          } finally {
            this.pendingReports--;
            this.finishIdle();
          }
        });
      }
      if (!browserClosing) {
        layer.hide();
      }
      this.detach(layer);
    } finally {
      this.completeTransaction();
    }
  }

  private completeTransaction(): void {
    this.needsSync = true;
    if (--this.transactions === 0) {
      // Reconciling or opening a deferred layer can synchronously admit or close another layer.
      this.transactions++;
      try {
        let passes = 0;
        while (this.needsSync) {
          if (++passes > MAX_SYNC_PASSES) {
            this.deferredOpens.clear();
            this.liveView()?.reportError(
              new Error('OverlayRuntime exceeded maximum synchronous reconciliation passes.'),
            );
            break;
          }
          this.needsSync = false;
          this.reconcile();
          if (this.releaseScroll && !this.stack.some(({ options }) => options.kind === 'modal')) {
            const release = this.releaseScroll;
            this.releaseScroll = undefined;
            release();
          }
          this.publishModal();
          for (const layer of [...this.deferredOpens]) {
            this.deferredOpens.delete(layer);
            try {
              this.open(layer);
            } catch (error) {
              this.liveView()?.reportError(error);
            }
          }
        }
      } finally {
        if (this.releaseScroll && !this.stack.some(({ options }) => options.kind === 'modal')) {
          const release = this.releaseScroll;
          this.releaseScroll = undefined;
          try {
            release();
          } catch {
            // Preserve teardown when the frame has navigated.
          }
        }
        this.transactions--;
        this.finishIdle();
      }
    }
  }

  private onFocus = (event: FocusEvent): void => {
    this.admit();
    if (!this.stack.length) {
      return;
    }
    const path = event.composedPath();
    for (const layer of this.stack) {
      layer.focused = path.includes(layer.options.element);
    }
  };

  private hasFocusSensitiveLayer(): boolean {
    for (const layer of this.stack) {
      if (layer.focused || layer.options.kind !== 'manual' || !layer.passive) {
        return true;
      }
    }
    return false;
  }

  private onPointer = (event: PointerEvent): void => {
    if (!this.hasFocusSensitiveLayer()) {
      return;
    }
    const view = this.liveView();
    if (view && this.pointerTimeout !== undefined) {
      view.clearTimeout(this.pointerTimeout);
      this.pointerTimeout = undefined;
    }
    const raw = event.target;
    this.pointerTarget =
      isElement(raw) && !hasShadowRoot(raw) ? raw : elementFromTarget(event.composedPath()[0]);
  };

  private clearPointer = (): void => {
    const view = this.liveView();
    if (view && this.pointerTimeout !== undefined) {
      view.clearTimeout(this.pointerTimeout);
      this.pointerTimeout = undefined;
    }
    this.pointerTarget = null;
  };

  private endPointer = (): void => {
    if (!this.pointerTarget) {
      return;
    }
    const view = this.liveView();
    if (!view) {
      this.pointerTarget = null;
      return;
    }
    if (this.pointerTimeout !== undefined) {
      view.clearTimeout(this.pointerTimeout);
    }
    this.pointerTimeout = view.setTimeout(() => {
      this.pointerTimeout = undefined;
      this.pointerTarget = null;
    }, 0);
  };

  private findForeignEscape(event: KeyboardEvent, candidate: Layer): 'manual' | 'other' | null {
    const focus = deepFocus(this.document);
    const own = new Set(this.stack.map(({ options }) => options.element as Element));
    for (const node of [...event.composedPath(), ...composedAncestors(focus)]) {
      if (isElement(node)) {
        if (
          matchesSelector(node, ':popover-open, :modal') &&
          !own.has(node) &&
          !composedContains(node, candidate.options.element) &&
          !(
            candidate.options.kind !== 'modal' &&
            candidate.trigger &&
            composedContains(node, candidate.trigger)
          )
        ) {
          return matchesSelector(node, ':popover-open') && getElementPopover(node) === 'manual'
            ? 'manual'
            : 'other';
        }
      }
    }
    return null;
  }

  private resolveEscapeTargets(): {
    readonly barrier: Layer | undefined;
    readonly layer: Layer | undefined;
  } {
    const barrierIndex = this.stack.findLastIndex(({ options }) => options.kind === 'modal');
    const barrier = barrierIndex >= 0 ? this.stack[barrierIndex] : undefined;
    const layer = this.stack.findLast((entry, index) => {
      const { options } = entry;
      return (
        entry.active &&
        (options.kind !== 'manual' || !entry.passive) &&
        (!barrier ||
          entry === barrier ||
          (barrier.active &&
            index > barrierIndex &&
            (composedContains(barrier.options.element, options.element) ||
              (options.kind !== 'modal' &&
                entry.trigger !== null &&
                composedContains(barrier.options.element, entry.trigger)))))
      );
    });
    return { barrier, layer };
  }

  private onEscapeCapture = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
      return;
    }
    const { barrier, layer } = this.resolveEscapeTargets();
    const candidate = layer ?? barrier;
    if (!candidate) {
      return;
    }
    const foreign = this.findForeignEscape(event, candidate);
    if (foreign) {
      foreignEscapes.set(event, foreign);
    }
  };

  private onEscape = (event: KeyboardEvent): void => {
    const capturedForeign = foreignEscapes.get(event) ?? null;
    foreignEscapes.delete(event);
    if (!event.isComposing && this.pointerTarget) {
      this.clearPointer();
    }
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
      return;
    }
    this.reconcile();
    const { barrier, layer } = this.resolveEscapeTargets();
    const candidate = layer ?? barrier;
    if (!candidate) {
      return;
    }
    const foreign = capturedForeign ?? this.findForeignEscape(event, candidate);
    if (foreign) {
      // Foreign manual popovers have no native Escape watcher; shield underlying native layers.
      if (foreign === 'manual' && candidate.options.kind !== 'manual') {
        event.preventDefault();
      }
      return;
    }
    if (!layer) {
      event.preventDefault();
      return;
    }
    if (layer.options.kind === 'auto') {
      if (barrier?.active) {
        event.preventDefault();
        this.finalDismiss(layer, 'escape');
      }
      return;
    }
    event.preventDefault();
    layer.onOpenChange(false, 'escape');
  };

  private finishIdle(): void {
    if (
      this.stack.length ||
      this.pending.size ||
      this.deferredOpens.size ||
      this.transactions ||
      this.pendingReports
    ) {
      return;
    }
    this.resize.disconnect();
    this.mutations.disconnect();
    if (this.releaseScroll) {
      const release = this.releaseScroll;
      this.releaseScroll = undefined;
      try {
        release();
      } catch {
        // Ignore cross-origin frame teardown.
      }
    }
    this.pointerTarget = null;
    removeListener(this.document, 'keydown', this.onEscapeCapture, true);
    removeListener(this.document, 'keydown', this.onEscape);
    removeListener(this.document, 'focusin', this.onFocus, true);
    removeListener(this.document, 'pointerdown', this.onPointer, true);
    removeListener(this.document, 'pointerup', this.endPointer, true);
    removeListener(this.document, 'pointercancel', this.endPointer, true);
    removeListener(this.document, 'contextmenu', this.clearPointer, true);
    removeListener(this.document, 'fullscreenchange', this.reconcile);
    const view = this.liveView();
    if (view) {
      if (this.pointerTimeout !== undefined) {
        view.clearTimeout(this.pointerTimeout);
        this.pointerTimeout = undefined;
      }
      removeListener(view, 'blur', this.clearPointer);
    }
    const isCurrent = resolveOverlayRuntime(this.document) === this;
    deleteFallbackOverlayRuntime(this.document, this);
    if (!isCurrent) {
      return;
    }
    try {
      if (Reflect.get(this.document, OVERLAY_RUNTIME_KEY) === this) {
        Reflect.deleteProperty(this.document, OVERLAY_RUNTIME_KEY);
      }
      const versions: unknown = Reflect.get(this.document, versionsKey);
      if (isVersionSet(versions)) {
        for (const version of this.registeredVersions) {
          versions.delete(version);
        }
        if (!versions.size) {
          Reflect.deleteProperty(this.document, versionsKey);
        }
      }
    } catch {
      // Ignore restricted document proxies on teardown.
    }
  }
}

function recordVersion(document: Document, runtime: OverlayRuntimeProtocol): void {
  try {
    const existing: unknown = Reflect.get(document, versionsKey);
    const storedVersions = isVersionSet(existing) ? existing : new Set<string>();
    if (storedVersions.size && !storedVersions.has(PACKAGE_VERSION) && devWarningsEnabled()) {
      console.warn('Unica overlay runtimes from different package versions share a document.');
    }
    storedVersions.add(PACKAGE_VERSION);
    Reflect.set(document, versionsKey, storedVersions);
    if (typeof runtime.trackVersion === 'function') {
      runtime.trackVersion(PACKAGE_VERSION);
    }
  } catch {
    // Ignore restricted document proxies.
  }
}

function runtimeFor(document: Document): OverlayRuntime | undefined {
  const view = liveViewOf(document);
  if (!view) {
    return undefined;
  }
  const current = resolveOverlayRuntime(document) as OverlayRuntime | undefined;
  if (current) {
    if (!joinedRuntimes.has(current)) {
      joinedRuntimes.add(current);
      recordVersion(document, current);
    }
    return current;
  }
  const runtime = new OverlayRuntime(document, view);
  joinedRuntimes.add(runtime);
  recordVersion(document, runtime);
  let stored = false;
  try {
    // Never overwrite an unrelated value occupying OVERLAY_RUNTIME_KEY.
    if (Reflect.get(document, OVERLAY_RUNTIME_KEY) === undefined) {
      stored = Reflect.set(document, OVERLAY_RUNTIME_KEY, runtime);
    }
  } catch {
    stored = false;
  }
  if (!stored) {
    setFallbackOverlayRuntime(document, runtime);
  }
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
  const document = ownerDocumentOf(container);
  if (!document) {
    return null;
  }
  const modal = resolveOverlayRuntime(document)?.resolveModal();
  if (!modal) {
    return container;
  }
  return container === documentBodyOf(document) || composedContains(container, modal)
    ? modal
    : null;
}

export function subscribeToModalChanges(document: Document, notify: () => void): () => void {
  addListener(document, modalChange, notify);
  return () => removeListener(document, modalChange, notify);
}

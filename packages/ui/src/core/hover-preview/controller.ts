import {
  composedAncestors,
  composedContains,
  containsSafe,
  getComputedStyleSafe,
  getLiveView,
  getLocalName,
  getOwnerDocument,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
  isInertElement,
  matchesSafe,
} from '../dom.js';
import { subscribeFocusOrigin } from '../focus-origin.js';
import type { FocusOrigin } from '../focus-origin.js';
import { hasHiddenAncestor } from '../overlay/dom.js';
import { positionOverlay } from '../overlay/positioning.js';
import type { Align, Side } from '../overlay/positioning.js';
import { registerOverlay, subscribeToModalChanges } from '../overlay/runtime.js';
import type { OverlayHandle } from '../overlay/runtime.js';
import { DEFAULT_PREVIEW_DELAY } from './domain.js';
import { retainPreviewRegistry } from './registry.js';
import type { PreviewFamily, PreviewOwner } from './registry.js';
import type { HoverPreviewChangeDetails } from './types.js';

const LEAVE_DELAY = 150;
const PREVIEW_GAP = 8;

type CommittedCommand =
  { readonly open: false } | { readonly open: true; readonly generation: number };

export interface PreviewOptions {
  readonly anchor: HTMLElement | null;
  readonly avoid: HTMLElement | null;
  readonly domain: object | null;
  readonly delay?: number | undefined;
  readonly side: Side;
  readonly align: Align;
  readonly padding: number;
  readonly external: boolean;
  readonly disabled: boolean;
  readonly controlled: boolean;
  readonly open: boolean;
  readonly admission: { blocked: boolean };
  readonly isMounted: () => boolean;
  readonly write: (open: boolean) => void;
  readonly notify: ((open: boolean, details: HoverPreviewChangeDetails) => void) | undefined;
}

function isHoverPointer(event: PointerEvent): boolean {
  return event.pointerType === 'mouse' || (event.pointerType === 'pen' && event.buttons === 0);
}

function hasSelection(surface: HTMLElement, document: Document): boolean {
  const root = getRootNodeSafe(surface) as Node & { getSelection?: () => Selection | null };
  const selection =
    typeof root.getSelection === 'function' ? root.getSelection() : document.getSelection();
  return Boolean(
    selection &&
    !selection.isCollapsed &&
    ((selection.anchorNode && containsSafe(surface, selection.anchorNode)) ||
      (selection.focusNode && containsSafe(surface, selection.focusNode))),
  );
}

export class PreviewController implements PreviewOwner {
  private options?: PreviewOptions;
  private desired = false;
  private visible = false;
  private disposed = false;
  private opening: number | undefined;
  private committedCommand: CommittedCommand | undefined;
  private hoverTrigger = false;
  private hoverSurface = false;
  private triggerFocused = false;
  private selectPointer: number | undefined;
  private selected = false;
  private origin: FocusOrigin | null = null;
  private hoverIntent: number | undefined;
  private openTimer: number | undefined;
  private closeTimer: number | undefined;
  private activationTimer: number | undefined;
  private availabilityFrame: number | undefined;
  private unsubscribeFocus: (() => void) | undefined;
  private unposition: (() => void) | undefined;
  private observation:
    | {
        observer: MutationObserver;
        roots: ReadonlySet<Node>;
        unsubscribeModal: () => void;
      }
    | undefined;
  private readonly handle: OverlayHandle;
  private readonly registry: ReturnType<typeof retainPreviewRegistry>['registry'];
  private readonly releaseRegistry: () => void;

  constructor(
    readonly family: PreviewFamily,
    readonly carrier: HTMLElement,
    readonly document: Document,
    private readonly view: NonNullable<ReturnType<typeof getLiveView>>,
  ) {
    const registration = retainPreviewRegistry(document, () => this.view.performance.now());
    this.registry = registration.registry;
    this.releaseRegistry = registration.release;
    this.handle = registerOverlay({
      kind: 'manual',
      element: carrier,
      passive: true,
      returnFocus: false,
      onOpenChange: (open, reason) => {
        if (open) {
          return;
        }
        if (reason === 'escape') {
          this.dismiss('escape');
        } else if (this.visible || this.unposition) {
          // A queued native report can arrive after the owner has committed false and
          // started a fresh open. It belongs to the previous positioned binding.
          this.lose(reason === 'lost' && !this.available() ? 'unavailable' : 'native');
        }
      },
    });
  }

  get domain(): object | null {
    return this.options?.domain ?? null;
  }

  update(options: PreviewOptions): void {
    const previous = this.options;
    const anchorChanged = options.anchor !== previous?.anchor;
    const newCommand =
      options.open &&
      !options.admission.blocked &&
      (!this.desired || (options.external && anchorChanged));
    this.options = options;
    if (anchorChanged || options.external !== previous?.external) {
      this.cancelOpen();
      this.cancelClose();
      this.cancelActivation();
      this.unsubscribeFocus?.();
      this.unsubscribeFocus = undefined;
      this.origin = null;
      this.hoverTrigger = false;
      this.triggerFocused = false;
      this.handle.setTrigger(options.anchor);
      if (options.anchor && !options.external) {
        this.unsubscribeFocus = subscribeFocusOrigin(options.anchor, (origin) => {
          this.origin = origin;
        });
      }
    } else if (options.disabled || options.domain !== previous?.domain) {
      this.cancelOpen();
    }

    if (!options.open) {
      if (this.desired) {
        this.desired = false;
        if (options.controlled) {
          this.commit(false);
        } else {
          this.hide();
        }
      }
      return;
    }
    this.desired = true;

    if (newCommand && options.controlled) {
      this.commit(true);
      return;
    }
    if (newCommand) {
      this.registry.intent();
    }
    if (this.committedCommand) {
      return;
    }
    if (
      (this.visible || this.opening !== undefined) &&
      (!this.available() || (anchorChanged && !options.external && !newCommand))
    ) {
      this.lose('unavailable');
      return;
    }
    if (this.visible || this.opening !== undefined) {
      if (
        anchorChanged ||
        options.avoid !== previous?.avoid ||
        options.side !== previous?.side ||
        options.align !== previous?.align ||
        options.padding !== previous?.padding
      ) {
        this.position();
      }
      return;
    }
    if (newCommand || (anchorChanged && !previous?.anchor)) {
      this.show();
    }
  }

  enterTrigger(event: PointerEvent): void {
    if (!isHoverPointer(event) || !this.available()) {
      return;
    }
    this.hoverTrigger = true;
    this.cancelClose();
    if (this.desired) {
      return;
    }
    const generation = this.registry.intent(() => this.cancelOpen());
    this.hoverIntent = generation;
    const delay = this.registry.isWarm(this) ? 0 : (this.options?.delay ?? DEFAULT_PREVIEW_DELAY);
    const open = (): void => {
      this.cancelOpen();
      if (this.registry.isCurrent(generation) && this.hoverTrigger && this.available()) {
        this.request(true, 'hover', event);
      }
    };
    if (delay === 0) {
      open();
    } else {
      this.openTimer = this.view.setTimeout(open, delay);
      this.syncObservation();
    }
  }

  leaveTrigger(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
      return;
    }
    this.hoverTrigger = false;
    this.cancelOpen();
    this.leave(event);
  }

  focusTrigger(event: FocusEvent, target: EventTarget | null): void {
    if (
      this.origin === 'pointer' ||
      !isElementNode(target) ||
      matchesSafe(target, ':disabled, [aria-disabled="true"]') ||
      (this.origin !== 'keyboard' && !matchesSafe(target, ':focus-visible')) ||
      !this.available()
    ) {
      return;
    }
    this.triggerFocused = true;
    this.cancelClose();
    this.registry.intent();
    this.request(true, 'focus', event);
  }

  blurTrigger(event: FocusEvent): void {
    const anchor = this.options?.anchor;
    if (
      anchor &&
      isElementNode(event.relatedTarget) &&
      composedContains(anchor, event.relatedTarget)
    ) {
      return;
    }
    this.triggerFocused = false;
    this.leave(event);
  }

  enterCarrier(event: PointerEvent): void {
    // During native text drag a mouse can enter the panel with a button held.
    if (isHoverPointer(event)) {
      this.hoverSurface = true;
      this.cancelClose();
    }
  }

  leaveCarrier(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      this.hoverSurface = false;
      this.leave(event);
    }
  }

  activate(event: MouseEvent): void {
    this.cancelActivation();
    this.dismiss('activation', event);
  }

  releaseActivationKey(event: KeyboardEvent, target: EventTarget | null): void {
    if (
      event.key !== ' ' ||
      event.isComposing ||
      !isElementNode(target) ||
      !matchesSafe(target, 'input[type="radio"]:checked:not(:disabled)')
    ) {
      return;
    }
    this.cancelActivation();
    // Some browsers skip click when Space activates an already selected radio.
    // Allow a native click, when dispatched, to own the same activation first.
    this.activationTimer = this.view.setTimeout(() => {
      this.activationTimer = undefined;
      if (!event.defaultPrevented) {
        this.dismiss('activation', event);
      }
    }, 0);
  }

  replace = (): void => this.lose('replacement');

  pointerDown = (event: PointerEvent): void => {
    const path = event.composedPath();
    if (path.includes(this.carrier)) {
      if (event.button === 0 && event.pointerType !== 'touch') {
        this.selectPointer = event.pointerId;
        this.cancelClose();
      }
      return;
    }
    if (!this.options?.anchor || !path.includes(this.options.anchor)) {
      this.dismiss('outside-press', event);
    }
  };

  pointerEnd = (event: PointerEvent): void => {
    if (this.selectPointer === event.pointerId) {
      this.selectPointer = undefined;
      this.selected = hasSelection(this.carrier, this.document);
      this.leave(event);
    }
  };

  selectionChanged = (): void => {
    const selected = hasSelection(this.carrier, this.document);
    if (this.selected !== selected) {
      this.selected = selected;
      if (selected) {
        this.cancelClose();
      } else {
        this.leave();
      }
    }
  };

  tab = (event: KeyboardEvent): void => {
    if (!this.options?.external) {
      this.dismiss('tab', event);
    }
  };

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.hide();
    this.unsubscribeFocus?.();
    this.handle.dispose();
    this.releaseRegistry();
  }

  private available(scope: 'local' | 'document' = 'document'): boolean {
    const { anchor, disabled, external } = this.options ?? {};
    if (
      !anchor ||
      disabled ||
      getOwnerDocument(anchor) !== this.document ||
      getOwnerDocument(this.carrier) !== this.document ||
      getLiveView(this.document) !== this.view ||
      !isConnectedNode(anchor) ||
      !isConnectedNode(this.carrier) ||
      hasHiddenAncestor(anchor, true) ||
      hasHiddenAncestor(this.carrier, true) ||
      matchesSafe(anchor, ':disabled') ||
      (!external && matchesSafe(anchor, '[aria-disabled="true"]')) ||
      (this.family === 'hover-card' &&
        (getLocalName(anchor) !== 'a' || !anchor.hasAttribute('href'))) ||
      isInertElement(anchor, scope) ||
      isInertElement(this.carrier, scope)
    ) {
      return false;
    }
    const style = getComputedStyleSafe(anchor);
    return (
      style?.visibility !== 'hidden' &&
      style?.visibility !== 'collapse' &&
      anchor.getClientRects().length > 0
    );
  }

  private commit(open: boolean): void {
    const command: CommittedCommand = open
      ? { open: true, generation: this.registry.intent() }
      : { open: false };
    this.committedCommand = command;
    if (!this.visible) {
      this.unposition?.();
      this.unposition = undefined;
    }
    // A controlled commit can arrive from any listener during native close.
    // Reconcile only the latest command after that event has unwound.
    this.view.queueMicrotask(() => {
      if (this.committedCommand !== command) {
        return;
      }
      this.committedCommand = undefined;
      if (!command.open) {
        this.hide();
      } else if (!this.handle.isOpen()) {
        this.hide();
        this.show(command.generation);
      } else if (!this.available()) {
        this.lose('unavailable');
      } else {
        this.opening = command.generation;
        this.position();
      }
    });
  }

  private show(command?: number): void {
    const options = this.options;
    if (
      !options ||
      this.opening !== undefined ||
      this.visible ||
      options.admission.blocked ||
      this.disposed ||
      typeof this.view.HTMLElement.prototype.showPopover !== 'function'
    ) {
      return;
    }
    if (!this.available()) {
      // An unavailable, mounted source defeats defaultOpen. Later independent
      // user intent should be able to open the uncontrolled preview normally.
      if (options.anchor && !options.controlled) {
        this.desired = false;
        options.write(false);
      }
      return;
    }
    const attempt = command ?? this.registry.intent();
    this.opening = attempt;
    this.handle.setOpen(true);
    const finish = (): void => {
      if (this.opening !== attempt || this.committedCommand) {
        return;
      }
      if (this.handle.isOpen()) {
        this.position();
      } else {
        this.lose(this.available() ? 'native' : 'unavailable');
      }
      this.syncObservation();
    };
    if (this.handle.isOpen()) {
      finish();
    } else {
      // The runtime can defer admission from focus events inside native showModal.
      this.view.queueMicrotask(finish);
    }
  }

  private onPositioned = (): void => {
    const attempt = this.opening;
    if (attempt === undefined || this.committedCommand) {
      return;
    }
    if (!this.registry.canAdmit(attempt, this.options?.controlled ?? false)) {
      this.lose('replacement');
      return;
    }
    this.opening = undefined;
    this.visible = true;
    this.handle.update({ passive: false });
    this.registry.admit(this, attempt);
    this.syncAvailabilityFrame();
  };

  private position(): void {
    const options = this.options;
    if (!options?.anchor) {
      this.unposition?.();
      this.unposition = undefined;
      return;
    }
    this.unposition = positionOverlay({
      anchor: options.anchor,
      floating: this.carrier,
      side: options.side,
      align: options.align,
      gap: PREVIEW_GAP,
      padding: options.padding,
      preview: {
        avoid: options.avoid,
        isAvailable: () => this.available(),
        onUnavailable: () => this.lose('unavailable'),
        onPositioned: this.onPositioned,
      },
    });
  }

  private hide(): void {
    this.committedCommand = undefined;
    this.opening = undefined;
    this.visible = false;
    this.hoverSurface = false;
    this.selectPointer = undefined;
    this.selected = false;
    this.cancelOpen();
    this.cancelClose();
    this.cancelActivation();
    this.unposition?.();
    this.unposition = undefined;
    this.handle.update({ passive: true });
    this.handle.setOpen(false, { returnFocus: false });
    this.registry.release(this);
    this.syncObservation();
  }

  private lose(reason: 'replacement' | 'unavailable' | 'native'): void {
    const options = this.options;
    if (!options || (!this.visible && this.opening === undefined)) {
      return;
    }
    const command = this.committedCommand;
    if (command) {
      // Keep the next command, but yield the physical carrier to a newly admitted owner.
      if (reason === 'replacement') {
        this.hide();
        this.committedCommand = command;
      }
      return;
    }
    const mounted = options.isMounted();
    const report = mounted && (this.visible || reason !== 'replacement');
    if (mounted && options.controlled) {
      options.admission.blocked = true;
    }
    this.hide();
    if (mounted && this.desired) {
      if (!options.controlled) {
        this.desired = false;
        options.write(false);
      }
      if (report) {
        options.notify?.(false, { reason });
      }
    }
  }

  private request(
    open: boolean,
    reason: HoverPreviewChangeDetails['reason'],
    originalEvent?: Event,
  ): void {
    const options = this.options;
    if (!options || this.disposed || open === this.desired) {
      return;
    }
    if (!options.controlled) {
      this.desired = open;
      options.write(open);
      if (open) {
        // Establish the opening state before a consumer can synchronously move focus.
        this.show();
      } else {
        this.hide();
      }
    }
    options.notify?.(open, originalEvent ? { reason, originalEvent } : { reason });
  }

  private dismiss(reason: 'tab' | 'escape' | 'activation' | 'outside-press', event?: Event): void {
    this.registry.invalidate();
    this.cancelClose();
    if (this.visible || this.opening !== undefined) {
      this.request(false, reason, event);
    }
  }

  private leave(event?: Event): void {
    if (
      this.options?.external ||
      (!this.visible && this.opening === undefined) ||
      this.hoverTrigger ||
      this.hoverSurface ||
      this.triggerFocused ||
      this.selected ||
      this.selectPointer !== undefined ||
      this.closeTimer !== undefined
    ) {
      return;
    }
    this.closeTimer = this.view.setTimeout(() => {
      this.closeTimer = undefined;
      this.request(false, 'leave', event);
    }, LEAVE_DELAY);
  }

  private cancelOpen(): void {
    if (this.hoverIntent !== undefined) {
      this.registry.completeIntent(this.hoverIntent);
      this.hoverIntent = undefined;
    }
    if (this.openTimer !== undefined) {
      this.view.clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
    this.syncObservation();
  }

  private cancelClose(): void {
    if (this.closeTimer !== undefined) {
      this.view.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  private cancelActivation(): void {
    if (this.activationTimer !== undefined) {
      this.view.clearTimeout(this.activationTimer);
      this.activationTimer = undefined;
    }
  }

  private syncObservation(): void {
    this.syncAvailabilityFrame();
    if (!this.visible && this.opening === undefined && this.openTimer === undefined) {
      this.observation?.observer.disconnect();
      this.observation?.unsubscribeModal();
      this.observation = undefined;
      return;
    }
    const roots = new Set<Node>([this.document]);
    for (const element of [this.options?.anchor ?? null, this.carrier]) {
      for (const ancestor of composedAncestors(element)) {
        roots.add(getRootNodeSafe(ancestor));
      }
    }
    const previous = this.observation;
    if (
      previous &&
      previous.roots.size === roots.size &&
      [...roots].every((root) => previous.roots.has(root))
    ) {
      return;
    }
    previous?.observer.disconnect();
    const observer =
      previous?.observer ??
      new this.view.MutationObserver((records) => {
        const openedModal = records.findLast(
          ({ attributeName, oldValue, target }) =>
            attributeName === 'open' &&
            oldValue === null &&
            isElementNode(target) &&
            matchesSafe(target, 'dialog:modal'),
        );
        const modal = openedModal?.target;
        if (isElementNode(modal)) {
          this.checkAvailability(modal);
        } else {
          this.checkAvailability();
        }
      });
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['aria-disabled', 'disabled', 'hidden', 'href', 'inert', 'open'],
    };
    this.observation = {
      observer,
      roots,
      unsubscribeModal:
        previous?.unsubscribeModal ??
        subscribeToModalChanges(this.document, () => this.checkAvailability()),
    };
    for (const root of roots) {
      observer.observe(root, options);
    }
  }

  private checkAvailability(openedModal?: Element): void {
    const inModal =
      !openedModal ||
      (composedContains(openedModal, this.options?.anchor ?? null) &&
        composedContains(openedModal, this.carrier));
    if (inModal && this.available()) {
      this.syncObservation();
    } else {
      this.cancelOpen();
      this.lose('unavailable');
    }
  }

  private syncAvailabilityFrame(): void {
    if (this.visible || this.openTimer !== undefined) {
      this.availabilityFrame ??= this.view.requestAnimationFrame(this.sampleAvailability);
    } else if (this.availabilityFrame !== undefined) {
      this.view.cancelAnimationFrame(this.availabilityFrame);
      this.availabilityFrame = undefined;
    }
  }

  private sampleAvailability = (): void => {
    this.availabilityFrame = undefined;
    // Check computed state here. Observation and admission handle document modal ownership.
    if (!this.available('local')) {
      this.cancelOpen();
      this.lose('unavailable');
      return;
    }
    this.syncAvailabilityFrame();
  };
}

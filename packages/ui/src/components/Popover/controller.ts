import type { MouseEvent as ReactMouseEvent } from 'react';
import { warnOnce } from '../../core/devWarning.js';
import {
  addListenerSafe,
  composedAncestors,
  composedContains,
  getLiveView,
  removeListenerSafe,
} from '../../core/dom.js';
import { retainFocusOrigin } from '../../core/focus-origin.js';
import { focusElement } from '../../core/overlay/dom.js';
import {
  anchorIntersectsViewport,
  positionOverlay,
  watchVisibleAnchors,
} from '../../core/overlay/positioning.js';
import type { AnchorVisibility } from '../../core/overlay/positioning.js';
import { registerOverlay } from '../../core/overlay/runtime.js';
import type { DismissReason, OverlayHandle } from '../../core/overlay/runtime.js';
import {
  canUseTrigger,
  focusContent,
  inTriggerPath,
  isVisibleTrigger,
  measurePanelBlockSize,
  revealContentFocus,
  trackPanelOverflow,
  trackTabExit,
} from './interaction.js';
import type { PopoverAlign, PopoverSide } from './types.js';

type Phase = 'closed' | 'preparing' | 'open';
type Input = 'direct' | 'touch' | 'programmatic';

interface Placement {
  readonly side: PopoverSide;
  readonly align: PopoverAlign;
}

interface Carrier {
  readonly node: HTMLDivElement;
  readonly document: Document;
  readonly handle: OverlayHandle;
  readonly stop: () => void;
}

interface SourceProposal {
  readonly anchor: HTMLElement;
  readonly input: Input;
}

interface Preparation {
  readonly carrier: Carrier;
  readonly source: SourceProposal | undefined;
  visibility?: AnchorVisibility;
}

interface Opening {
  readonly anchor: HTMLElement;
  readonly input: Input;
  readonly carrier: Carrier;
  readonly visibility: AnchorVisibility;
  placed?: Placement;
  onPositioned?: () => void;
  stopPosition?: () => void;
  stopInteraction?: () => void;
}

export interface PopoverView {
  readonly phase: Phase;
  readonly contentId: string | undefined;
}

const registeredTriggers = new WeakSet<EventTarget>();

export class PopoverController {
  private readonly triggers = new Set<HTMLElement>();
  private readonly contents = new Map<HTMLDivElement, Placement>();
  private carrier: Carrier | undefined;
  private preparation: Preparation | undefined;
  private opening: Opening | undefined;
  private stage: Phase = 'closed';
  private committedStage: Phase = 'closed';
  private contentId: string | undefined;
  private preferredSource: HTMLElement | undefined;
  private failedSource: HTMLElement | undefined;
  private sourceProposal: SourceProposal | undefined;
  private focusSelection: (() => void) | undefined;
  private suppressedClick: HTMLElement | undefined;
  private clearSuppression: (() => void) | undefined;
  private blocked = false;
  private protectedByParent = false;
  private pendingReport = false;
  private queued = false;
  private live = false;
  private lifetime = 0;

  constructor(
    private readonly readRequested: () => boolean,
    private readonly propose: (open: boolean) => void,
    private readonly publishView: (view: PopoverView) => void,
  ) {}

  start(): () => void {
    this.live = true;
    return () => {
      this.live = false;
      this.lifetime++;
      this.queued = false;
      this.pendingReport = false;
      this.clearSuppression?.();
      this.cancelPreparation();
      this.endOpening();
      this.releaseCarrier();
      this.stage = 'closed';
      this.committedStage = 'closed';
      this.contentId = undefined;
    };
  }

  commit(phase: Phase, requested: boolean, protectedByParent: boolean): void {
    this.committedStage = phase;
    this.protectedByParent = protectedByParent;
    this.sync(requested);
  }

  addTrigger = (node: HTMLElement): (() => void) => {
    this.triggers.add(node);
    registeredTriggers.add(node);
    this.triggerVisibility()?.observe(node);
    this.queueSync();
    return () => {
      this.triggers.delete(node);
      registeredTriggers.delete(node);
      this.triggerVisibility()?.unobserve(node);
      this.queueSync();
    };
  };

  addContent = (node: HTMLDivElement): (() => void) => {
    this.contents.set(node, { side: 'bottom', align: 'center' });
    this.queueSync();
    return () => {
      this.contents.delete(node);
      this.queueSync();
    };
  };

  updateContent(node: HTMLDivElement, placement: Placement): void {
    if (this.contents.has(node)) {
      this.contents.set(node, placement);
      this.queueSync();
    }
  }

  activate(
    event: ReactMouseEvent<HTMLElement>,
    anchor: HTMLElement,
    pointerType: string | undefined,
  ): void {
    const click = event.nativeEvent;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      click.composedPath().find((node) => registeredTriggers.has(node)) !== anchor
    ) {
      return;
    }
    if (!canUseTrigger(anchor)) {
      event.preventDefault();
      return;
    }
    if (
      anchor.matches('a[href]') &&
      (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
    ) {
      return;
    }
    event.preventDefault();
    if (this.suppressedClick === anchor && event.detail > 0) {
      this.clearSuppression?.();
      return;
    }
    if (this.stage !== 'closed') {
      this.propose(false);
      return;
    }

    const gestureType = 'pointerType' in click ? click.pointerType || pointerType : pointerType;
    const input = !click.isTrusted ? 'programmatic' : gestureType === 'touch' ? 'touch' : 'direct';
    if (this.pendingReport) {
      const lifetime = this.lifetime;
      queueMicrotask(() => {
        if (lifetime === this.lifetime && this.triggers.has(anchor) && canUseTrigger(anchor)) {
          this.requestOpening(anchor, input);
        }
      });
      return;
    }
    this.requestOpening(anchor, input);
  }

  private requestOpening(anchor: HTMLElement, input: Input): void {
    const proposal = { anchor, input } as const;
    this.sourceProposal = proposal;
    this.blocked = false;
    this.publish();
    this.propose(true);

    // A rejected or deferred controlled proposal must not supply a stale input modality
    // to a later, unrelated programmatic opening.
    queueMicrotask(() => {
      if (this.sourceProposal === proposal && !this.readRequested()) {
        this.sourceProposal = undefined;
      }
    });
  }

  requestClose = (): void => {
    if (this.stage === 'open') {
      this.propose(false);
    }
  };

  private publish(): void {
    this.publishView({ phase: this.stage, contentId: this.contentId });
  }

  private queueSync(): void {
    if (!this.live || this.queued) {
      return;
    }
    this.queued = true;
    const lifetime = this.lifetime;
    queueMicrotask(() => {
      if (lifetime === this.lifetime) {
        this.queued = false;
        this.sync();
      }
    });
  }

  private availableTrigger(candidate: HTMLElement, document: Document): boolean {
    return (
      this.triggers.has(candidate) &&
      candidate.ownerDocument === document &&
      isVisibleTrigger(candidate)
    );
  }

  private orderedTriggers(document: Document, exclude?: HTMLElement): HTMLElement[] {
    const candidates = [...this.triggers].filter(
      (candidate) => candidate !== exclude && this.availableTrigger(candidate, document),
    );
    candidates.sort((a, b) => {
      if (a === this.preferredSource) {
        return -1;
      }
      if (b === this.preferredSource) {
        return 1;
      }
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_DISCONNECTED) {
        return 0;
      }
      return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
    });
    return candidates;
  }

  private triggerVisibility(): AnchorVisibility | undefined {
    return this.preparation?.visibility ?? this.opening?.visibility;
  }

  private cancelPreparation(): void {
    this.preparation?.visibility?.dispose();
    this.preparation = undefined;
  }

  private releaseCarrier(): void {
    this.cancelFocusSelection();
    this.carrier?.stop();
    this.carrier = undefined;
  }

  private cancelFocusSelection(): void {
    this.focusSelection?.();
    this.focusSelection = undefined;
  }

  private resolveFocusTrigger(
    document: Document,
    restore: (trigger: HTMLElement | null) => void,
  ): void {
    this.cancelFocusSelection();
    const candidates = this.orderedTriggers(document, this.failedSource).filter(
      anchorIntersectsViewport,
    );
    if (!this.live || !candidates.length) {
      restore(null);
      return;
    }
    const cancel = (): void => this.cancelFocusSelection();
    const visibility = watchVisibleAnchors(document, candidates, (visible) => {
      this.cancelFocusSelection();
      restore(
        candidates.find(
          (trigger) =>
            visible.has(trigger) &&
            this.availableTrigger(trigger, document) &&
            anchorIntersectsViewport(trigger),
        ) ?? null,
      );
    });
    // A later focus event is a new decision even if it returns to the previous element.
    addListenerSafe(document, 'focusin', cancel, true);
    this.focusSelection = () => {
      removeListenerSafe(document, 'focusin', cancel, true);
      visibility.dispose();
    };
  }

  private bindCarrier(node: HTMLDivElement): Carrier {
    const { ownerDocument: document } = node;
    let reportsStarted = 0;
    const handle = registerOverlay({
      kind: 'auto',
      activation: 'component',
      element: node,
      trigger: this.orderedTriggers(document)[0] ?? null,
      resolveFocusTrigger: (restore) => this.resolveFocusTrigger(document, restore),
      onDismissStart: (reason, target) => {
        reportsStarted++;
        this.nativeDismiss(carrier, reason, target);
      },
      onOpenChange: (open, reason) => {
        if (open) {
          return;
        }
        if (reportsStarted) {
          reportsStarted--;
        } else {
          // A document runtime shared with an earlier copy may report through this hook only.
          this.nativeDismiss(carrier, reason, null);
        }
      },
    });
    const onToggle = (): void => {
      const opening = this.opening;
      if (opening?.carrier === carrier && this.stage === 'preparing') {
        this.finishAdmission(opening);
      }
    };
    addListenerSafe(node, 'toggle', onToggle);
    // The opening gesture can precede the first mounted focus-aware field in this document.
    const releaseFocusOrigin = retainFocusOrigin(document);
    const carrier: Carrier = {
      node,
      document,
      handle,
      stop: () => {
        try {
          removeListenerSafe(node, 'toggle', onToggle);
          handle.dispose();
        } finally {
          releaseFocusOrigin();
        }
      },
    };
    return carrier;
  }

  private sync(requested = this.readRequested()): void {
    if (!this.live) {
      return;
    }

    const node = this.contents.keys().next().value;
    const id = node?.id || undefined;
    if (id !== this.contentId) {
      this.contentId = id;
      this.publish();
    }
    if (this.contents.size > 1 || (!node && this.triggers.size)) {
      warnOnce('popover-content-count', 'Popover requires exactly one PopoverContent.');
    }
    if (node && !this.triggers.size) {
      warnOnce('popover-trigger-count', 'Popover requires at least one PopoverTrigger.');
    }
    if (
      this.carrier &&
      (this.carrier.node !== node || this.carrier.document !== node.ownerDocument)
    ) {
      if (this.opening) {
        this.finalDismiss(this.opening, 'lost');
      } else if (this.preparation) {
        this.cancelPreparation();
        this.setPhase('closed');
        if (requested) {
          this.rejectOpening();
        }
      }
      this.releaseCarrier();
    }
    if (!this.carrier && node) {
      this.carrier = this.bindCarrier(node);
    }
    if (!requested) {
      // A committed false acknowledges dismissal. Only a later false → true requests a new show.
      this.blocked = false;
      this.sourceProposal = undefined;
      this.cancelPreparation();
      if (this.opening) {
        const { carrier } = this.opening;
        this.endOpening();
        carrier.handle.setOpen(false);
      }
      this.setPhase('closed');
      return;
    }
    // The parent keeps all descendants inert until its own native admission completes.
    if (this.blocked || this.pendingReport || this.protectedByParent) {
      return;
    }

    if (this.stage === 'closed') {
      this.prepare();
    } else if (
      this.stage === 'preparing' &&
      this.committedStage === 'preparing' &&
      this.preparation
    ) {
      this.admit(this.preparation);
    } else if (this.stage === 'open' && this.opening) {
      this.place(this.opening);
    }
  }

  private prepare(): void {
    this.cancelFocusSelection();
    const { carrier, sourceProposal: source } = this;
    this.sourceProposal = undefined;
    if (!carrier) {
      warnOnce('popover-content-count', 'Popover requires exactly one PopoverContent.');
      this.rejectOpening();
      return;
    }
    if (
      source
        ? !this.availableTrigger(source.anchor, carrier.document)
        : this.orderedTriggers(carrier.document).length === 0
    ) {
      this.rejectOpening();
      return;
    }
    this.preparation = { carrier, source };
    this.setPhase('preparing');
  }

  private rejectOpening(): void {
    this.blocked = true;
    this.cancelPreparation();
    this.setPhase('closed');
    this.queueReport();
  }

  private admit(preparation: Preparation): void {
    const { carrier, source } = preparation;
    const { node } = carrier;
    if (preparation.visibility || !node.querySelector(':scope > .unica-popover-inner')) {
      return;
    }

    // The first sample happens after the inert children commit, before native show can
    // move focus or dismiss another top-layer surface. Keep watching the active anchor's clip.
    const visibility = watchVisibleAnchors(carrier.document, [...this.triggers], (visible) => {
      if (this.opening?.visibility === visibility) {
        if (!visible.has(this.opening.anchor)) {
          this.finalDismiss(this.opening, 'lost');
        }
        return;
      }
      if (this.preparation !== preparation || !this.readRequested()) {
        return;
      }
      const canAnchor = (trigger: HTMLElement): boolean =>
        visible.has(trigger) &&
        this.availableTrigger(trigger, carrier.document) &&
        anchorIntersectsViewport(trigger);
      const anchor = source
        ? canAnchor(source.anchor)
          ? source.anchor
          : undefined
        : this.orderedTriggers(carrier.document).find(canAnchor);
      if (anchor) {
        this.show(carrier, anchor, source?.input ?? 'programmatic', visibility);
      } else {
        this.rejectOpening();
      }
    });
    preparation.visibility = visibility;
  }

  private show(
    carrier: Carrier,
    anchor: HTMLElement,
    input: Input,
    visibility: AnchorVisibility,
  ): void {
    this.preparation = undefined;
    this.preferredSource = anchor;
    this.failedSource = undefined;
    const opening: Opening = { anchor, input, carrier, visibility };
    this.opening = opening;
    const { node, handle } = carrier;
    if (!node.getAttribute('aria-label')?.trim() && !node.getAttribute('aria-labelledby')?.trim()) {
      warnOnce(
        'popover-content-name',
        'PopoverContent needs a PopoverTitle or an explicit accessible name.',
      );
    }
    if (!node.querySelector('.unica-popover-close')) {
      warnOnce('popover-content-close', 'PopoverContent needs a visible PopoverClose.');
    }

    // Descendants are inert before their first React commit and throughout the native
    // focus-selection step. The carrier wins over descendant HTML and React autofocus.
    node.setAttribute('autofocus', '');
    handle.setOpen(false, { returnFocus: false });
    handle.setTrigger(anchor);
    handle.setOpen(true);
    this.finishAdmission(opening);
  }

  private finishAdmission(opening: Opening): void {
    const { node } = opening.carrier;
    const inner = node.querySelector<HTMLDivElement>(':scope > .unica-popover-inner');
    if (
      this.opening !== opening ||
      this.stage !== 'preparing' ||
      !inner ||
      !node.matches(':popover-open')
    ) {
      return;
    }

    node.removeAttribute('autofocus');
    if (opening.input !== 'direct') {
      focusElement(node, opening.carrier.document);
      if (this.opening !== opening || !node.matches(':popover-open')) {
        return;
      }
    }
    inner.removeAttribute('inert');
    this.setPhase('open');
    const inside = (target: Element | null): boolean =>
      composedContains(node, target) || inTriggerPath(this.triggers, target);
    const stopTabExit = trackTabExit(node, inside, () => this.finalDismiss(opening, 'tab'));
    const overflow = trackPanelOverflow(node, inner);
    opening.stopInteraction = () => {
      stopTabExit();
      overflow.dispose();
    };
    if (opening.input === 'direct') {
      focusContent(node);
      if (this.opening !== opening) {
        return;
      }
      opening.onPositioned = () => {
        delete opening.onPositioned;
        overflow.measure();
        revealContentFocus(node);
      };
    }
    this.place(opening);
  }

  private place(opening: Opening): void {
    const {
      anchor,
      carrier: { node },
    } = opening;
    const placement = this.contents.get(node);
    if (
      !placement ||
      (placement.side === opening.placed?.side && placement.align === opening.placed.align)
    ) {
      return;
    }
    opening.placed = placement;
    opening.stopPosition?.();
    opening.stopPosition = positionOverlay({
      anchor,
      floating: node,
      ...placement,
      gap: 8,
      padding: 16,
      popover: {
        measureBlockSize: measurePanelBlockSize,
        isAnchorAvailable: canUseTrigger,
        onUnavailable: () => this.finalDismiss(opening, 'lost'),
        onPositioned: () => opening.onPositioned?.(),
      },
    });
  }

  private nativeDismiss(carrier: Carrier, reason: DismissReason, target: Element | null): void {
    const opening = this.opening;
    if (!opening || opening.carrier !== carrier) {
      return;
    }
    if (reason === 'native' && target) {
      for (const element of composedAncestors(target)) {
        if (this.triggers.has(element as HTMLElement)) {
          this.suppressClick(carrier.document, element as HTMLElement);
          break;
        }
      }
    }
    this.finalDismiss(opening, reason, true);
  }

  private finalDismiss(
    opening: Opening,
    reason: DismissReason | 'tab',
    ownedByRuntime = false,
  ): void {
    if (this.opening !== opening) {
      return;
    }
    if (reason === 'lost') {
      this.failedSource = opening.anchor;
    }
    this.blocked = true;
    this.endOpening();
    this.setPhase('closed');
    if (!ownedByRuntime) {
      opening.carrier.handle.setOpen(false, { returnFocus: reason !== 'tab' });
    }
    this.queueReport();
  }

  private queueReport(): void {
    if (this.pendingReport) {
      return;
    }
    this.pendingReport = true;
    const lifetime = this.lifetime;
    queueMicrotask(() => {
      if (this.live && this.lifetime === lifetime) {
        this.pendingReport = false;
        try {
          this.propose(false);
        } finally {
          this.queueSync();
        }
      }
    });
  }

  private endOpening(): void {
    const opening = this.opening;
    this.opening = undefined;
    opening?.carrier.node.removeAttribute('autofocus');
    opening?.visibility.dispose();
    opening?.stopInteraction?.();
    opening?.stopPosition?.();
  }

  private setPhase(phase: Phase): void {
    if (phase !== this.stage) {
      this.stage = phase;
      for (const trigger of this.triggers) {
        trigger.setAttribute('aria-expanded', String(phase === 'open'));
      }
      this.publish();
    }
  }

  private suppressClick(document: Document, source: HTMLElement): void {
    this.clearSuppression?.();
    this.suppressedClick = source;
    const view = getLiveView(document);
    const clear = (): void => {
      this.suppressedClick = undefined;
      this.clearSuppression = undefined;
      removeListenerSafe(document, 'pointerdown', clear, true);
      removeListenerSafe(document, 'pointercancel', clear, true);
      removeListenerSafe(document, 'keydown', clear, true);
      view?.clearTimeout(timer);
    };
    this.clearSuppression = clear;
    addListenerSafe(document, 'pointerdown', clear, true);
    addListenerSafe(document, 'pointercancel', clear, true);
    addListenerSafe(document, 'keydown', clear, true);
    const timer = view?.setTimeout(clear, 750);
  }
}

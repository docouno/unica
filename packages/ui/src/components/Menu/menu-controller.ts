import type { CollectionItem, TypeaheadBuffer } from '../../core/collections/navigation.js';
import { recoverRovingKey, navigateCollection } from '../../core/collections/navigation.js';
import {
  composedContains,
  getComposedParentElement,
  getComputedStyleSafe,
  getDeepActiveElement,
  isContentEditableSafe,
  isInertElement,
  isRTL,
} from '../../core/dom.js';
import { focusElement } from '../../core/overlay/dom.js';
import {
  overlayInlineBounds,
  positionOverlay,
  watchVisibleAnchors,
} from '../../core/overlay/positioning.js';
import { registerOverlay } from '../../core/overlay/runtime.js';
import type { OverlayHandle } from '../../core/overlay/runtime.js';
import type { MenuAlign } from './types.js';

type EntryFocus = 'first' | 'last' | 'panel';

export interface MenuOrigin {
  readonly owner: Element;
  readonly restore: Element | null;
  readonly focus: EntryFocus;
  readonly point?: { readonly x: number; readonly y: number } | undefined;
  readonly capture?: ((panel: HTMLElement) => () => void) | undefined;
  readonly button?: boolean | undefined;
}

export interface MenuPanel {
  host: HTMLDivElement | null;
  level: HTMLDivElement | null;
  active: string | null;
  items: readonly MenuRow[];
  buffer: TypeaheadBuffer | null;
}

export function menuPanel(): MenuPanel {
  return { host: null, level: null, active: null, items: [], buffer: null };
}

export interface MenuBranch {
  readonly parent: MenuPanel;
  readonly panel: MenuPanel;
  row: HTMLButtonElement | null;
  id: string;
  labelId: string;
  label: string;
}

interface MenuRow extends CollectionItem {
  readonly node: HTMLElement;
}

type BranchMode = 'start' | 'end' | 'inline';

interface OpenBranch {
  readonly branch: MenuBranch;
  readonly mode: BranchMode;
  readonly explicit: boolean;
  readonly width: number;
}

interface Binding {
  readonly node: HTMLDivElement;
  readonly handle: OverlayHandle;
  readonly dispose: () => void;
}

interface NativeDismissal {
  readonly restore: Element | null;
  readonly notify: boolean;
  closedPropCommitted: boolean;
  requestedOrigin?: MenuOrigin | undefined;
}

const padding = 16;
const branchGap = 6;
const panelSelector = '[data-unica-menu-level]';
const rowSelector = '[data-unica-menu-row]';

export function nearestLevel(target: Element | null): Element | null | undefined {
  return target?.closest(panelSelector);
}

function hiddenForFocus(element: Element): boolean {
  const visibility = element.ownerDocument.defaultView?.getComputedStyle(element).visibility;
  return isInertElement(element) || visibility === 'hidden' || visibility === 'collapse';
}

function visibleForFocus(element: Element): boolean {
  return (
    element.isConnected &&
    element.getClientRects().length > 0 &&
    !element.matches(':disabled') &&
    !hiddenForFocus(element)
  );
}

export function available<T extends Element>(element: T | null): element is T {
  return element !== null && visibleForFocus(element) && !element.matches('[aria-disabled="true"]');
}

const nativeFocus = 'a[href], button, input:not([type=hidden]), select, textarea, summary, iframe';

export function isFocusOrigin(element: Element): boolean {
  const tabIndex = element.getAttribute('tabindex');
  return (
    available(element) &&
    ((tabIndex !== null && /^[-+]?\d+$/u.test(tabIndex.trim())) ||
      element.matches(nativeFocus) ||
      (isContentEditableSafe(element) && !isContentEditableSafe(element.parentElement ?? element)))
  );
}

function visibleBranchRow(row: HTMLButtonElement): boolean {
  const frame = row.parentElement;
  if (!frame?.hidden || !frame.classList.contains('unica-menu-row-frame')) {
    return visibleForFocus(row);
  }
  // Sample the row's author styles without the previous level's owned frame.
  frame.hidden = false;
  frame.inert = false;
  try {
    return visibleForFocus(row);
  } finally {
    frame.hidden = true;
    frame.inert = true;
  }
}

function inlineSourcePresented(row: HTMLButtonElement): boolean {
  if (
    !row.isConnected ||
    row.hidden ||
    row.inert ||
    row.matches(':disabled, [aria-disabled="true"]')
  ) {
    return false;
  }
  const style = getComputedStyleSafe(row);
  if (
    !style ||
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse' ||
    style.getPropertyValue('interactivity') === 'inert'
  ) {
    return false;
  }
  // The previous level's owned frame has no layout box. Read the author
  // styles around it without unhiding the frame on every positioning sample.
  const group = row.parentElement?.parentElement;
  return Boolean(group && !isInertElement(group) && layoutAncestorsAvailable(group));
}

function layoutAncestorsAvailable(element: Element): boolean {
  for (let node: Element | null = element; node; node = getComposedParentElement(node)) {
    const ancestorStyle = getComputedStyleSafe(node);
    if (ancestorStyle?.display === 'none' || ancestorStyle?.contentVisibility === 'hidden') {
      return false;
    }
    if (node.matches('.unica-menu[popover]')) {
      break;
    }
  }
  return true;
}

function presented(host: HTMLElement): boolean {
  const style = host.ownerDocument.defaultView?.getComputedStyle(host);
  const ready =
    host.hasAttribute('data-unica-menu-positioned') || host.hasAttribute('data-unica-menu-inline');
  return (
    host.isConnected &&
    !host.hidden &&
    !isInertElement(host) &&
    style?.display !== 'none' &&
    (!host.matches(':popover-open') || host.getClientRects().length > 0) &&
    (!ready || (style?.visibility !== 'hidden' && style?.visibility !== 'collapse'))
  );
}

function inlinePresented({ host, level }: MenuPanel): boolean {
  return Boolean(
    host &&
    level &&
    presented(host) &&
    layoutAncestorsAvailable(host) &&
    (level.hasAttribute('data-unica-menu-inactive') || level.getClientRects().length > 0),
  );
}

function managedMutation({ target, attributeName }: MutationRecord): boolean {
  if (target.nodeType !== 1 || !attributeName) {
    return false;
  }
  const element = target as HTMLElement;
  return (
    attributeName.startsWith('data-unica-menu-') ||
    ((attributeName === 'hidden' || attributeName === 'inert') &&
      element.matches('.unica-menu-row-frame')) ||
    (attributeName === 'style' && element.matches('.unica-menu[popover]') && presented(element))
  );
}

function measureCarrierWidth(host: HTMLElement): number {
  const visibility = host.ownerDocument.defaultView?.getComputedStyle(host).visibility;
  const positioning = host.matches(':popover-open:not([data-unica-menu-positioned])');
  if (
    host.hidden ||
    isInertElement(host) ||
    (!positioning && (visibility === 'hidden' || visibility === 'collapse'))
  ) {
    return 0;
  }
  host.setAttribute('data-unica-menu-measure', '');
  try {
    return host.getBoundingClientRect().width;
  } finally {
    host.removeAttribute('data-unica-menu-measure');
  }
}

function rows(panel: MenuPanel): MenuRow[] {
  const { level } = panel;
  if (!level) {
    return [];
  }
  return Array.from(level.querySelectorAll<HTMLElement>(rowSelector))
    .filter((node) => nearestLevel(node) === level && !node.hidden && visibleForFocus(node))
    .map((node) => ({
      node,
      key: node.id,
      label: node.querySelector('.unica-menu-label')?.textContent ?? '',
    }));
}

function syncColumns(panel: MenuPanel): void {
  const level = panel.level;
  const scroll = level?.querySelector(':scope > .unica-menu-scroll');
  if (!level || !scroll) {
    return;
  }
  for (const part of ['mark', 'icon']) {
    const members = scroll.querySelectorAll(`[data-unica-menu-${part}]`);
    scroll.toggleAttribute(
      `data-unica-menu-${part}s`,
      Array.from(members).some((node) => nearestLevel(node) === level && !node.closest('[hidden]')),
    );
  }
}

function measureBlockSize(host: HTMLElement): number {
  const level = Array.from(host.querySelectorAll<HTMLElement>(panelSelector)).find(
    (node) =>
      node.closest('.unica-menu[popover]') === host &&
      !node.hasAttribute('data-unica-menu-inactive'),
  );
  const scroll = level?.querySelector<HTMLElement>(':scope > .unica-menu-scroll');
  return host.offsetHeight + (scroll ? scroll.scrollHeight - scroll.clientHeight : 0);
}

function physicalReference(owner: Element, x: number, y: number, width = 0): DOMRect {
  return new owner.ownerDocument.defaultView!.DOMRect(x, y, width, 0);
}

export class MenuController {
  readonly root: MenuPanel = menuPanel();
  trigger: HTMLButtonElement | null = null;
  visible = false;
  origin: MenuOrigin | undefined;
  path: readonly OpenBranch[] = [];

  private align: MenuAlign = 'start';
  private pending: MenuOrigin | undefined;
  private nativeDismissal: NativeDismissal | undefined;
  private requestingClose = false;
  private rootBinding: Binding | undefined;
  private readonly branches = new Map<HTMLButtonElement, MenuBranch>();
  private readonly bindings = new Map<MenuBranch, Binding>();
  private readonly subscribers = new Set<() => void>();
  private revision = 0;
  private blocked = false;
  private proposal = 0;
  private started = false;
  private queued = false;
  private stopPosition: (() => void) | undefined;
  private stopOpening: (() => void) | undefined;
  private focusedPanel: MenuPanel | undefined;
  private pendingFocus: { panel: MenuPanel; focus?: EntryFocus; row?: HTMLElement } | undefined;
  private hoverTimer: number | undefined;
  private hoverRow: HTMLElement | undefined;
  private lastPointer: { x: number; y: number } | undefined;
  private aim: { x: number; y: number; until: number } | undefined;
  private lockedWidth = new Map<MenuPanel, number>();
  private placedAlign: MenuAlign | undefined;
  private publishedTrigger: HTMLButtonElement | null = null;
  private publishedContentId: string | undefined;

  constructor(
    private readonly requested: () => boolean,
    private readonly propose: (next: boolean) => void,
  ) {}

  subscribe = (subscriber: () => void): (() => void) => {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  };

  snapshot = (): number => this.revision;

  publish(): void {
    this.revision++;
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }

  start(): () => void {
    this.started = true;
    this.sync();
    return () => {
      this.started = false;
      this.end();
      this.rootBinding?.dispose();
      this.rootBinding = undefined;
      this.nativeDismissal = undefined;
      this.blocked = false;
      this.pending = undefined;
    };
  }

  schedule = (): void => {
    if (!this.queued) {
      this.queued = true;
      queueMicrotask(() => {
        this.queued = false;
        this.sync();
      });
    }
  };

  setTrigger = (node: HTMLButtonElement | null): void => {
    if (node && node.localName !== 'button') {
      throw new Error('MenuTrigger requires a component that renders a button.');
    }
    this.trigger = node;
    this.schedule();
  };

  setRoot = (node: HTMLDivElement | null): void => {
    this.root.host = node;
    this.schedule();
  };

  setLevel(panel: MenuPanel, node: HTMLDivElement | null): void {
    panel.level = node;
  }

  setAlign(align: MenuAlign): void {
    this.align = align;
    this.schedule();
  }

  setBranchLabel(branch: MenuBranch, label: string): void {
    if (branch.label !== label) {
      branch.label = label;
      this.publish();
    }
  }

  setBranchHost(branch: MenuBranch, node: HTMLDivElement | null): void {
    branch.panel.host = node;
    this.schedule();
  }

  setBranchRow(branch: MenuBranch, node: HTMLButtonElement | null): void {
    if (branch.row) {
      this.branches.delete(branch.row);
    }
    branch.row = node;
    if (node) {
      this.branches.set(node, branch);
    }
    this.schedule();
  }

  request(origin: MenuOrigin): void {
    if (!this.started) {
      return;
    }
    if (this.nativeDismissal) {
      this.nativeDismissal.requestedOrigin = origin;
      return;
    }
    if (this.visible) {
      this.resetPath();
      this.origin = origin;
      this.root.buffer = null;
      this.root.active = null;
      this.opening(origin);
      this.publish();
      return;
    }
    this.pending = origin;
    this.blocked = false;
    const proposal = ++this.proposal;
    this.propose(true);
    this.sync();
    queueMicrotask(() => {
      if (this.proposal === proposal && this.pending === origin && !this.requested()) {
        this.pending = undefined;
      }
    });
  }

  requestClose(): void {
    if (!this.visible || !this.rootBinding?.handle.isOpen() || this.requestingClose) {
      return;
    }
    this.requestingClose = true;
    try {
      this.propose(false);
    } finally {
      this.requestingClose = false;
    }
    this.sync();
  }

  sync = (): void => {
    if (!this.started) {
      return;
    }
    const host = this.root.host;
    const id = host?.id;
    if (this.publishedTrigger !== this.trigger || this.publishedContentId !== id) {
      this.publishedTrigger = this.trigger;
      this.publishedContentId = id;
      this.publish();
    }
    if ((this.rootBinding?.node ?? null) !== host) {
      if (this.visible) {
        this.dismiss(this.rootBinding, true);
      }
      this.rootBinding?.dispose();
      this.rootBinding = host ? this.bind(host) : undefined;
      if (this.nativeDismissal) {
        // A disposed carrier cannot deliver the pending native notification.
        this.finishNativeDismissal(this.nativeDismissal);
        return;
      }
    }
    const binding = this.rootBinding;
    binding?.handle.setTrigger(this.trigger);
    const requested = this.requested();
    if (this.nativeDismissal) {
      this.nativeDismissal.closedPropCommitted ||= !requested;
      return;
    }
    if (!requested) {
      this.blocked = false;
      if (this.visible) {
        this.close(false);
      }
      return;
    }
    if (this.blocked || !binding) {
      return;
    }
    if (this.visible) {
      if (!presented(binding.node)) {
        this.close(true);
        return;
      }
      const origin = this.origin;
      if (
        origin?.button &&
        this.trigger &&
        this.trigger !== origin.owner &&
        available(this.trigger)
      ) {
        const next = { ...origin, owner: this.trigger, restore: this.trigger };
        this.origin = next;
        this.opening(next, false);
      }
      if (!available(this.origin?.owner ?? null)) {
        this.close(true);
      } else {
        if (this.origin && this.align !== this.placedAlign) {
          this.placeRoot(this.origin);
        }
        this.syncPath();
        this.recoverFocus();
      }
      return;
    }
    if (this.origin) {
      return;
    }
    const origin =
      this.pending ??
      (this.trigger &&
        ({
          owner: this.trigger,
          restore: this.trigger,
          focus: 'panel',
          button: true,
        } satisfies MenuOrigin));
    this.pending = undefined;
    if (
      !origin ||
      !available(origin.owner) ||
      !binding.node.isConnected ||
      origin.owner.ownerDocument !== binding.node.ownerDocument ||
      measureCarrierWidth(binding.node) <= 0
    ) {
      return;
    }
    this.origin = origin;
    binding.handle.setOpen(false, { returnFocus: false });
    binding.handle.setOpen(true);
    if (binding.handle.isOpen()) {
      this.admit(origin);
    }
  };

  private bind(node: HTMLDivElement): Binding {
    const handle = registerOverlay({
      kind: 'auto',
      activation: 'component',
      element: node,
      trigger: this.trigger,
      resolveFocusTrigger: (restore) => {
        const caller = this.nativeDismissal?.restore ?? this.restoreTarget();
        if (caller && caller !== this.trigger && focusElement(caller, node.ownerDocument)) {
          return;
        }
        restore(available(this.trigger) ? this.trigger : null);
      },
      onDismissStart: () => {
        if (this.rootBinding !== binding || !this.origin) {
          return;
        }
        this.nativeDismissal = {
          restore: this.restoreTarget(),
          notify: !this.requestingClose && this.requested(),
          closedPropCommitted: !this.requested(),
        };
        this.blocked = true;
        this.end();
        this.publish();
      },
      onOpenChange: (open) => {
        if (open || this.rootBinding !== binding) {
          return;
        }
        const dismissal = this.nativeDismissal;
        if (dismissal) {
          this.finishNativeDismissal(dismissal);
        } else {
          // The shared document runtime can be provided by an earlier package copy.
          this.dismiss(binding);
        }
      },
    });
    const onToggle = (): void => {
      if (this.origin && !this.visible && this.rootBinding === binding && handle.isOpen()) {
        this.admit(this.origin);
      }
    };
    node.addEventListener('toggle', onToggle);
    const binding: Binding = {
      node,
      handle,
      dispose: () => {
        node.removeEventListener('toggle', onToggle);
        handle.dispose();
      },
    };
    return binding;
  }

  private finishNativeDismissal(dismissal: NativeDismissal): void {
    this.nativeDismissal = undefined;
    if (dismissal.requestedOrigin) {
      this.request(dismissal.requestedOrigin);
      return;
    }
    const requested = this.requested();
    if (dismissal.closedPropCommitted && requested) {
      this.blocked = false;
    } else if (dismissal.notify && requested) {
      this.propose(false);
    }
    this.sync();
  }

  private admit(origin: MenuOrigin): void {
    this.visible = true;
    this.opening(origin);
    this.publish();
  }

  private restoreTarget(): Element | null {
    const source = this.origin?.restore ?? null;
    if (available(source)) {
      return source;
    }
    return available(this.trigger) ? this.trigger : null;
  }

  private focusCaller(document: Document): void {
    const restore = this.restoreTarget();
    if (!focusElement(restore, document) && restore !== this.trigger && available(this.trigger)) {
      focusElement(this.trigger, document);
    }
  }

  private opening(origin: MenuOrigin, focus = true): void {
    this.stopOpening?.();
    const host = this.root.host;
    if (!host) {
      return;
    }
    const { ownerDocument: document } = host;
    const view = document.defaultView;
    if (!view) {
      return;
    }
    const releaseContact = origin.capture?.(host);
    const visibility = watchVisibleAnchors(document, [origin.owner], (sample) => {
      if (this.origin === origin && this.visible && !sample.has(origin.owner)) {
        this.close(true);
      }
    });
    const onScroll = (event: Event): void => {
      const fromMenu = event.composedPath().includes(host);
      if (origin.point && !fromMenu) {
        this.close(true);
      } else {
        this.scheduleReflow();
      }
    };
    const reflow = (): void => this.scheduleReflow();
    const mutations = new view.MutationObserver((records) => {
      if (!presented(host)) {
        this.close(true);
        return;
      }
      if (records.every(managedMutation)) {
        return;
      }
      syncColumns(this.root);
      for (const { branch } of this.path) {
        syncColumns(branch.panel);
      }
      this.syncPath();
      this.recoverFocus();
      this.scheduleReflow();
    });
    mutations.observe(host, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    for (
      let parent = getComposedParentElement(host);
      parent;
      parent = getComposedParentElement(parent)
    ) {
      mutations.observe(parent, { attributes: true, childList: true });
    }
    view.addEventListener('scroll', onScroll, true);
    view.addEventListener('resize', reflow);
    view.visualViewport?.addEventListener('resize', reflow);
    view.visualViewport?.addEventListener('scroll', reflow);
    document.fonts?.addEventListener('loadingdone', reflow);
    this.stopOpening = () => {
      releaseContact?.();
      if (this.reflowFrame !== undefined) {
        view.cancelAnimationFrame(this.reflowFrame);
        this.reflowFrame = undefined;
      }
      visibility.dispose();
      mutations.disconnect();
      view.removeEventListener('scroll', onScroll, true);
      view.removeEventListener('resize', reflow);
      view.visualViewport?.removeEventListener('resize', reflow);
      view.visualViewport?.removeEventListener('scroll', reflow);
      document.fonts?.removeEventListener('loadingdone', reflow);
    };
    syncColumns(this.root);
    if (focus) {
      this.pendingFocus = { panel: this.root, focus: origin.focus };
    }
    this.placeRoot(origin);
  }

  private placeRoot(origin: MenuOrigin): void {
    const host = this.root.host;
    if (!host) {
      return;
    }
    this.placedAlign = this.align;
    this.stopPosition?.();
    const { point, owner } = origin;
    this.stopPosition = positionOverlay({
      anchor: owner,
      floating: host,
      reference: point && {
        contextElement: owner,
        getBoundingClientRect: () => physicalReference(owner, point.x, point.y),
      },
      side: 'bottom',
      align: point || !origin.button ? 'start' : this.align,
      gap: point ? 4 : 6,
      padding,
      popover: {
        measureBlockSize,
        point: Boolean(point),
        preserveSide: true,
        lockSide: () => this.lockedWidth.has(this.root),
        isAnchorAvailable: available,
        isFloatingAvailable: (floating) => this.samplePresentation(floating),
        onUnavailable: () => this.close(true),
        onPositioned: () => {
          if (!host.hasAttribute('data-unica-menu-positioned')) {
            host.setAttribute('data-unica-menu-positioned', '');
          }
          if (!presented(host)) {
            this.close(true);
            return;
          }
          this.flushFocus(this.currentLevel(this.root));
          this.schedule();
          this.scheduleReflow();
        },
      },
    });
  }

  private samplePresentation(host: HTMLElement): boolean {
    if (!presented(host)) {
      return false;
    }
    if (host.hasAttribute('data-unica-menu-positioned')) {
      for (const { branch, mode } of this.path) {
        const nested = branch.panel.host;
        const parent = this.carrier(branch.parent).host;
        if (
          mode === 'inline' &&
          nested?.hasAttribute('data-unica-menu-inline') &&
          parent?.hasAttribute('data-unica-menu-positioned') &&
          (!inlinePresented(branch.panel) || !branch.row || !inlineSourcePresented(branch.row))
        ) {
          this.schedule();
          return true;
        }
      }
      if (this.focusRecoveryPanel()) {
        this.schedule();
      }
    }
    return true;
  }

  private dismiss(binding: Binding | undefined, replaced = false): void {
    if (!this.visible || !binding || binding !== this.rootBinding) {
      return;
    }
    if (replaced) {
      const { ownerDocument: document } = binding.node;
      const active = getDeepActiveElement(document);
      if (
        composedContains(binding.node, active) ||
        (this.focusedPanel && (!active || active === document.body))
      ) {
        this.focusCaller(document);
      }
    }
    this.end();
    this.blocked = true;
    this.publish();
    if (this.requested()) {
      this.propose(false);
    }
  }

  private close(notify: boolean, tab = false): void {
    const binding = this.rootBinding;
    if (!this.visible || !binding) {
      return;
    }
    const { ownerDocument: document } = binding.node;
    if (tab) {
      this.focusCaller(document);
    }
    this.resetPath();
    binding.handle.setOpen(false, { returnFocus: !tab });
    if (this.nativeDismissal) {
      return;
    }
    this.end();
    this.blocked = notify;
    this.publish();
    if (notify && this.requested()) {
      this.propose(false);
    }
  }

  private end(): void {
    this.visible = false;
    this.rootBinding?.node.removeAttribute('data-unica-menu-positioned');
    this.resetPath();
    this.stopOpening?.();
    this.stopOpening = undefined;
    this.stopPosition?.();
    this.stopPosition = undefined;
    this.origin = undefined;
    this.pendingFocus = undefined;
    this.focusedPanel = undefined;
    this.lastPointer = undefined;
    this.root.active = null;
    this.root.buffer = null;
  }

  private resetPath(): void {
    this.trim(0);
  }

  private trim(length: number): void {
    this.cancelHover();
    for (const { branch } of this.path.slice(length).reverse()) {
      this.releaseBranch(branch);
      branch.panel.active = null;
      branch.panel.buffer = null;
    }
    this.path = this.path.slice(0, length);
    this.updateLocks();
  }

  private releaseBranch(branch: MenuBranch): void {
    this.bindings.get(branch)?.dispose();
    this.bindings.delete(branch);
  }

  private updateLocks(): void {
    const next = new Map<MenuPanel, number>();
    for (const entry of this.path) {
      if (entry.mode === 'inline') {
        const carrier = this.carrier(entry.branch.parent);
        if (!next.has(carrier)) {
          next.set(carrier, entry.width);
        }
      }
    }
    for (const panel of this.lockedWidth.keys()) {
      if (!next.has(panel)) {
        panel.host?.style.removeProperty('--_menu-locked-width');
      }
    }
    for (const [panel, width] of next) {
      panel.host?.style.setProperty('--_menu-locked-width', `${width}px`);
    }
    this.lockedWidth = next;
  }

  stateFor(branch: MenuBranch): OpenBranch | undefined {
    return this.path.find((entry) => entry.branch === branch);
  }

  inlineChild(panel: MenuPanel): MenuBranch | undefined {
    return this.path.find((entry) => entry.branch.parent === panel && entry.mode === 'inline')
      ?.branch;
  }

  currentLevel(carrier: MenuPanel): MenuPanel {
    let panel = carrier;
    let branch = this.inlineChild(panel);
    while (branch) {
      panel = branch.panel;
      branch = this.inlineChild(panel);
    }
    return panel;
  }

  activeLabel(carrier: MenuPanel): string | undefined {
    const active = this.currentLevel(carrier);
    return active === carrier
      ? undefined
      : this.path.find(({ branch }) => branch.panel === active)?.branch.label;
  }

  private carrier(panel: MenuPanel): MenuPanel {
    let current = panel;
    let entry = this.path.find(({ branch }) => branch.panel === current);
    while (entry?.mode === 'inline') {
      current = entry.branch.parent;
      entry = this.path.find(({ branch }) => branch.panel === current);
    }
    return current;
  }

  private chooseMode(branch: MenuBranch): BranchMode | undefined {
    const host = branch.panel.host;
    const row = branch.row;
    const parent = this.carrier(branch.parent).host;
    const view = host?.ownerDocument.defaultView;
    if (!host || !row || !parent || !view) {
      return undefined;
    }
    syncColumns(branch.panel);
    const width = measureCarrierWidth(host);
    if (width <= 0) {
      return undefined;
    }
    if (view.matchMedia('(pointer: coarse)').matches) {
      return 'inline';
    }
    const bounds = overlayInlineBounds(parent, padding);
    const box = parent.getBoundingClientRect();
    const roomLeft = box.left - bounds.left;
    const roomRight = bounds.right - box.right;
    const rtl = isRTL(row);
    if ((rtl ? roomLeft : roomRight) >= width + branchGap) {
      return 'end';
    }
    return (rtl ? roomRight : roomLeft) >= width + branchGap ? 'start' : 'inline';
  }

  private reflowFrame: number | undefined;

  private scheduleReflow(): void {
    const view = this.root.host?.ownerDocument.defaultView;
    if (!view || !this.path.length || this.reflowFrame !== undefined) {
      return;
    }
    this.reflowFrame = view.requestAnimationFrame(() => {
      this.reflowFrame = undefined;
      this.reflow();
    });
  }

  private reflow(): void {
    for (const [index, entry] of this.path.entries()) {
      const { branch } = entry;
      const mode = this.chooseMode(branch);
      if (mode === entry.mode) {
        continue;
      }
      const row = branch.row;
      const host = branch.panel.host;
      const active = row && getDeepActiveElement(row.ownerDocument);
      const focused = Boolean(host && composedContains(host, active));
      if (!mode || (!entry.explicit && mode === 'inline' && !focused)) {
        this.closeBranch(index, focused || this.lostBranchFocus(index, active));
        return;
      } else {
        const snapshot = this.path;
        const width =
          this.carrier(branch.parent).host?.getBoundingClientRect().width ?? entry.width;
        for (const next of snapshot.slice(index).reverse()) {
          this.releaseBranch(next.branch);
        }
        this.path = snapshot.map((next) => (next === entry ? { ...next, mode, width } : next));
        this.cancelHover();
        this.updateLocks();
        if (focused) {
          const panel =
            snapshot.findLast((next) => next.branch.panel.level === nearestLevel(active ?? null))
              ?.branch.panel ?? branch.panel;
          this.pendingFocus = {
            panel,
            focus: 'first',
            ...(active && 'focus' in active ? { row: active as HTMLElement } : {}),
          };
        }
      }
      this.publish();
      return;
    }
  }

  openBranch(branch: MenuBranch, explicit: boolean): void {
    if (!this.visible || !available(branch.row) || !branch.panel.host) {
      return;
    }
    const existing = this.stateFor(branch);
    if (existing) {
      if (explicit) {
        this.focus(this.currentLevel(branch.panel), 'first');
      }
      return;
    }
    const mode = this.chooseMode(branch);
    if (!mode || (!explicit && mode === 'inline')) {
      return;
    }
    const parentIndex = this.path.findIndex(({ branch: entry }) => entry.panel === branch.parent);
    const width = this.carrier(branch.parent).host?.getBoundingClientRect().width ?? 0;
    this.trim(parentIndex + 1);
    this.path = [...this.path, { branch, mode, explicit, width }];
    this.updateLocks();
    if (explicit) {
      this.pendingFocus = { panel: branch.panel, focus: 'first' };
    }
    this.publish();
  }

  private syncPath(): void {
    const document = this.root.host?.ownerDocument;
    if (!document) {
      return;
    }
    for (const [index, { branch, mode }] of this.path.entries()) {
      const {
        row,
        panel: { host },
      } = branch;
      if (
        !row?.isConnected ||
        row.matches(':disabled, [aria-disabled="true"]') ||
        row.hidden ||
        row.parentElement?.parentElement?.closest('[hidden]') ||
        !host?.isConnected ||
        host.hidden ||
        (host.matches(':popover-open') && !presented(host)) ||
        (host.hasAttribute('data-unica-menu-inline') && !inlinePresented(branch.panel)) ||
        // A repositioning carrier is temporarily hidden as a whole. Its own
        // admission callback will recheck when rows can be measured again.
        (this.carrier(branch.parent).host?.hasAttribute('data-unica-menu-positioned') &&
          !visibleBranchRow(row))
      ) {
        const current = getDeepActiveElement(document);
        const ownsFocus =
          (host && composedContains(host, current)) || this.lostBranchFocus(index, current);
        this.closeBranch(index, Boolean(ownsFocus));
        return;
      }
      if (mode !== 'inline' && !this.bindings.has(branch)) {
        const carrier = this.carrier(branch.parent).host;
        if (
          !carrier?.hasAttribute('data-unica-menu-positioned') ||
          host.getAttribute('popover') !== 'auto'
        ) {
          break;
        }
        this.showBranch(branch, row, host, mode);
      }
    }
    const pending = this.pendingFocus;
    if (pending && this.carrier(pending.panel).host?.hasAttribute('data-unica-menu-positioned')) {
      this.flushFocus(pending.panel);
    }
  }

  private showBranch(
    branch: MenuBranch,
    row: HTMLButtonElement,
    host: HTMLDivElement,
    mode: 'start' | 'end',
  ): void {
    const { ownerDocument: document } = host;
    const handle = registerOverlay({
      kind: 'auto',
      activation: 'component',
      element: host,
      trigger: row,
      resolveFocusTrigger: (restore) => restore(available(row) ? row : null),
      onOpenChange: (open, reason) => {
        if (!open && this.bindings.get(branch)?.handle === handle) {
          const index = this.path.findIndex((entry) => entry.branch === branch);
          if (index >= 0) {
            const active = getDeepActiveElement(document);
            const restore =
              reason === 'lost' &&
              (!active || active === document.body || composedContains(host, active)) &&
              this.path.slice(index).some(({ branch: entry }) => entry.panel === this.focusedPanel);
            this.closeBranch(index, restore);
          }
        }
      },
    });
    const parent = this.carrier(branch.parent).host;
    let stop: (() => void) | undefined;
    const place = (): void => {
      if (!parent || stop || !handle.isOpen()) {
        return;
      }
      stop = positionOverlay({
        anchor: row,
        floating: host,
        reference: {
          contextElement: row,
          getBoundingClientRect: () => {
            const rect = parent.getBoundingClientRect();
            return physicalReference(
              row,
              rect.left,
              row.getBoundingClientRect().top - 5,
              rect.width,
            );
          },
        },
        side: mode,
        align: 'start',
        gap: branchGap,
        padding,
        popover: {
          fixedSide: true,
          measureBlockSize,
          isAnchorAvailable: (element) => {
            const rect = element.getBoundingClientRect();
            const scroll = row.closest('.unica-menu-scroll')?.getBoundingClientRect();
            return (
              available(element) &&
              (!scroll || (rect.top < scroll.bottom && rect.bottom > scroll.top))
            );
          },
          isFloatingAvailable: presented,
          onUnavailable: () => {
            const index = this.path.findIndex((entry) => entry.branch === branch);
            if (index >= 0) {
              const active = getDeepActiveElement(document);
              this.closeBranch(
                index,
                composedContains(host, active) || this.lostBranchFocus(index, active),
              );
            }
          },
          onPositioned: () => {
            if (!host.hasAttribute('data-unica-menu-positioned')) {
              host.setAttribute('data-unica-menu-positioned', '');
            }
            if (presented(host)) {
              this.flushFocus(this.currentLevel(branch.panel));
            }
            this.schedule();
            this.scheduleReflow();
          },
        },
      });
    };
    this.bindings.set(branch, {
      node: host,
      handle,
      dispose: () => {
        stop?.();
        host.removeAttribute('data-unica-menu-positioned');
        host.removeEventListener('toggle', place);
        handle.dispose();
      },
    });
    host.addEventListener('toggle', place);
    handle.setOpen(true);
    place();
  }

  private lostBranchFocus(index: number, active: Element | null): boolean {
    return (
      (!active || active === this.root.host?.ownerDocument.body) &&
      this.path.slice(index).some(({ branch }) => branch.panel === this.focusedPanel)
    );
  }

  private closeBranch(index: number, restore: boolean): void {
    const entry = this.path[index];
    if (!entry) {
      return;
    }
    const {
      branch: { parent, row },
    } = entry;
    this.trim(index);
    if (restore) {
      this.pendingFocus = row ? { panel: parent, row } : { panel: parent, focus: 'first' };
    }
    this.publish();
  }

  back(panel: MenuPanel): void {
    const index = this.path.findIndex(({ branch }) => branch.panel === panel);
    this.closeBranch(index, true);
  }

  private flushFocus(panel: MenuPanel): void {
    const pending = this.pendingFocus;
    if (!pending || pending.panel !== panel || this.currentLevel(this.carrier(panel)) !== panel) {
      return;
    }
    this.pendingFocus = undefined;
    if (!pending.row || !this.focusRow(panel, pending.row)) {
      this.focus(panel, pending.focus ?? 'first');
    }
  }

  rememberFocus(panel: MenuPanel, node: HTMLElement): void {
    this.focusedPanel = panel;
    panel.active = node.id;
    panel.items = rows(panel);
  }

  private focusRow(panel: MenuPanel, node: HTMLElement): boolean {
    if (!focusElement(node, node.ownerDocument)) {
      return false;
    }
    this.rememberFocus(panel, node);
    const scroll = node.closest('.unica-menu-scroll');
    if (scroll) {
      const bounds = scroll.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      if (rect.top < bounds.top) {
        scroll.scrollTop += rect.top - bounds.top;
      } else if (rect.bottom > bounds.bottom) {
        scroll.scrollTop += rect.bottom - bounds.bottom;
      }
    }
    return true;
  }

  focusEntry(focus: EntryFocus): void {
    this.focus(this.currentLevel(this.root), focus);
  }

  private focus(panel: MenuPanel, focus: EntryFocus): void {
    const candidates = rows(panel);
    const choices = candidates.filter(({ node }) => !node.hasAttribute('data-unica-menu-back'));
    const row =
      focus === 'panel'
        ? undefined
        : (choices.length ? choices : candidates).at(focus === 'last' ? -1 : 0);
    if (!row || !this.focusRow(panel, row.node)) {
      this.focusedPanel = panel;
      panel.active = null;
      this.carrier(panel).host?.focus({ preventScroll: true });
    }
  }

  private focusRecoveryPanel(): MenuPanel | undefined {
    const host = this.root.host;
    if (!host || !this.visible || this.pendingFocus) {
      return undefined;
    }
    const panel = this.focusedPanel;
    if (!panel?.active) {
      return undefined;
    }
    const { ownerDocument: document } = host;
    const active = getDeepActiveElement(document);
    const previous = panel.items.find(({ key }) => key === panel.active)?.node;
    if (
      (active && active !== document.body && active !== previous) ||
      (previous && !previous.hidden && visibleForFocus(previous))
    ) {
      return undefined;
    }
    return panel;
  }

  private recoverFocus(): void {
    const panel = this.focusRecoveryPanel();
    if (!panel?.active) {
      return;
    }
    const items = rows(panel);
    const next = recoverRovingKey(items, panel.items, panel.active, panel.active);
    const row = items.find(({ key }) => key === next);
    if (!row || !this.focusRow(panel, row.node)) {
      this.focus(panel, 'panel');
    }
  }

  keydown(panel: MenuPanel, event: KeyboardEvent): void {
    if (
      !this.visible ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing ||
      event.keyCode === 229
    ) {
      return;
    }
    this.cancelHover();
    const { key } = event;
    const host = this.carrier(panel).host;
    if (!host) {
      return;
    }
    const rtl = isRTL(host);
    const levelIndex = this.path.findIndex(({ branch }) => branch.panel === panel);
    const active = getDeepActiveElement(host.ownerDocument);
    const row = active?.closest<HTMLElement>(rowSelector) ?? null;
    if (key === 'Tab') {
      this.close(true, true);
      return;
    }
    if (!event.shiftKey) {
      if (key === 'Escape') {
        event.preventDefault();
        if (this.path.length) {
          this.closeBranch(this.path.length - 1, true);
        } else {
          this.close(true);
        }
        return;
      }
      if (levelIndex >= 0 && key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
        event.preventDefault();
        this.closeBranch(levelIndex, true);
        return;
      }
      const branch = row && this.branches.get(row as HTMLButtonElement);
      if (branch?.parent === panel && key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
        event.preventDefault();
        this.openBranch(branch, true);
        return;
      }
      if (key === ' ' && row) {
        panel.buffer = null;
        if (row.localName === 'a') {
          event.preventDefault();
          row.click();
        }
        return;
      }
    }
    const items = rows(panel);
    const next = navigateCollection(
      event,
      {
        items,
        activeKey: row?.id ?? null,
        orientation: 'vertical',
        direction: rtl ? 'rtl' : 'ltr',
        wrap: true,
        typeahead: true,
      },
      panel.buffer,
      event.timeStamp,
    );
    panel.buffer = next.buffer;
    if (next.handled) {
      event.preventDefault();
      const target = items.find(({ key: id }) => id === next.key);
      if (target) {
        this.focusRow(panel, target.node);
      }
    }
  }

  hover(panel: MenuPanel, row: HTMLElement | null, event: PointerEvent): void {
    const view = panel.host?.ownerDocument.defaultView;
    if (!this.visible || !view || event.pointerType !== 'mouse' || event.buttons) {
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    const previous = this.lastPointer;
    this.lastPointer = point;
    const current = this.path.find(({ branch }) => branch.parent === panel);
    if (current?.mode === 'inline') {
      return;
    }
    if (row === current?.branch.row) {
      this.cancelHover();
      this.lastPointer = point;
      return;
    }
    const child = current?.branch.panel.host;
    const active = child && getDeepActiveElement(child.ownerDocument);
    if (child && active?.matches(':focus-visible') && composedContains(child, active)) {
      return;
    }
    if (row === this.hoverRow && this.hoverTimer !== undefined && !this.aim) {
      return;
    }
    const aim =
      this.aim ?? (child && previous ? { ...previous, until: event.timeStamp + 300 } : undefined);
    let delay = 170;
    if (child && aim && previous && event.timeStamp < aim.until) {
      const box = child.getBoundingClientRect();
      const edge = Math.abs(box.left - aim.x) < Math.abs(box.right - aim.x) ? box.left : box.right;
      const progress = (point.x - aim.x) / (edge - aim.x);
      const top = aim.y + (box.top - 8 - aim.y) * progress;
      const bottom = aim.y + (box.bottom + 8 - aim.y) * progress;
      if (
        progress >= 0 &&
        progress <= 1 &&
        point.y >= top &&
        point.y <= bottom &&
        Math.abs(edge - point.x) < Math.abs(edge - previous.x)
      ) {
        delay = aim.until - event.timeStamp;
      }
    }
    this.cancelHover();
    this.lastPointer = point;
    this.aim = delay === 170 ? undefined : aim;
    this.hoverRow = row ?? undefined;
    const branch = row && this.branches.get(row as HTMLButtonElement);
    if (row && (branch || current)) {
      this.hoverTimer = view.setTimeout(() => {
        this.hoverTimer = undefined;
        if (!row.matches(':hover')) {
          return;
        }
        const focused = child && getDeepActiveElement(child.ownerDocument);
        if (child && focused && composedContains(child, focused)) {
          if (focused.matches(':focus-visible')) {
            return;
          }
          this.focusRow(panel, row);
        }
        if (branch?.parent === panel) {
          this.openBranch(branch, false);
        } else if (current) {
          const index = this.path.indexOf(current);
          this.closeBranch(index, false);
        }
      }, delay);
    }
  }

  private cancelHover(): void {
    if (this.hoverTimer !== undefined) {
      this.root.host?.ownerDocument.defaultView?.clearTimeout(this.hoverTimer);
    }
    this.hoverTimer = undefined;
    this.hoverRow = undefined;
    this.aim = undefined;
  }
}

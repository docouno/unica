import { useId, useInsertionEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactElement, RefObject } from 'react';
import { Portal, usePortalContainer } from '../../core/Portal.js';
import { cx, dataFlag } from '../../core/cx.js';
import {
  composedContains,
  containsSafe,
  getDeepActiveElement,
  getLiveView,
  getRootNodeSafe,
  isElementNode,
} from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { registerOverlay, resolveToastPortalHost } from '../../core/overlay/runtime.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { ToastDock, ToastList } from './ToastStack.js';
import { announceFromCarrier } from './announce.js';
import { useToastOwner } from './context.js';
import { recordToastFocus, restoreToastFocus } from './focus.js';
import type { ToastFocus } from './focus.js';
import {
  getToastActiveElement,
  hasToastVisibility,
  isOpenToastCarrier,
  useToastHost,
} from './host.js';
import { positionCarrier } from './position.js';
import type { Edge } from './position.js';
import {
  layoutReading,
  readableToastIds,
  rememberReadingPosition,
  revealReadingControl,
  rowSelector,
  toastHitTarget,
} from './reading.js';
import type { ReadingPosition } from './reading.js';
import type { ToastEntry, ToastQueue } from './store.js';
import type { ToastId, ToastMessages, ToastPlacement, ToastViewportProps } from './types.js';
import './toast.css';

const emptyEntries: readonly ToastEntry[] = [];
const noEntries = (): readonly ToastEntry[] => emptyEntries;
const noViewport = (): undefined => undefined;
const noIds: ReadonlySet<ToastId> = new Set();

interface CarrierProps extends ToastViewportProps {
  readonly host: HTMLElement;
  readonly scope: HTMLElement;
  readonly placement: ToastPlacement;
  readonly queue: ToastQueue;
  readonly entries: readonly ToastEntry[];
  readonly front: ToastEntry;
  readonly messages: ToastMessages;
  readonly expanded: boolean;
  readonly toggle: () => void;
  readonly hold: (id: ToastId | null) => void;
  readonly reading: RefObject<ReadingPosition>;
  readonly focus: RefObject<ToastFocus>;
  readonly pointerInsideRef: RefObject<boolean>;
  readonly visibilityRef: RefObject<(() => void) | undefined>;
}

function ToastCarrier({
  host,
  scope,
  placement,
  queue,
  entries,
  front,
  messages,
  expanded,
  toggle,
  hold,
  reading,
  focus,
  pointerInsideRef,
  visibilityRef,
  id,
  ref,
  className,
  style,
  ...attributes
}: CarrierProps): ReactElement {
  const controls = useId();
  const root = useRef<HTMLDivElement>(null);
  const combinedRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const [edge, setEdge] = useState<Edge>(placement.startsWith('top') ? 'top' : 'bottom');
  const top = edge === 'top';
  const measure = useRef<() => void>(undefined);
  const refreshAnnouncements = useRef<() => void>(undefined);

  useIsoLayoutEffect(() => {
    const node = root.current;
    const view = getLiveView(node?.ownerDocument ?? null);
    if (!node || !view) {
      return;
    }
    const document = node.ownerDocument;
    const available = (): boolean =>
      document.visibilityState !== 'hidden' &&
      host === resolveToastPortalHost(scope) &&
      isOpenToastCarrier(node, host);
    const overlay = registerOverlay({
      element: node,
      kind: 'manual',
      passive: true,
      returnFocus: false,
      onOpenChange: () => queue.refreshReading(),
    });
    const detach = queue.attachReading({
      window: view,
      readable: () => {
        if (
          !document.hasFocus() ||
          pointerInsideRef.current ||
          composedContains(node, getToastActiveElement(node)) ||
          !available()
        ) {
          return noIds;
        }
        const scrollport = node.querySelector<HTMLElement>('.unica-toast-list, .unica-toast-stack');
        return scrollport ? readableToastIds(node, scrollport) : noIds;
      },
    });
    overlay.setOpen(true);

    function refresh(): void {
      measure.current?.();
      refreshAnnouncements.current?.();
    }
    let frame: number | undefined;
    function schedule(): void {
      if (frame === undefined) {
        frame = view!.requestAnimationFrame(() => {
          frame = undefined;
          refresh();
        });
      }
    }
    function attention(): void {
      queue.refreshReading();
      refreshAnnouncements.current?.();
      schedule();
    }

    function externalScroll(event: Event): void {
      if (!containsSafe(node!, event.target)) {
        schedule();
      }
    }
    const channels = Array.from(
      node.querySelectorAll<HTMLElement>(':scope > :is([role="status"], [role="alert"])'),
    );
    const availability = (): string =>
      available() ? channels.map(hasToastVisibility).join(',') : '';
    let previousAvailability = availability();
    visibilityRef.current = () => {
      const next = availability();
      if (next !== previousAvailability) {
        previousAvailability = next;
        attention();
      }
    };
    const focusRoot = getRootNodeSafe(node);
    const focusTargets = focusRoot === document ? [document] : [focusRoot, document];
    const viewport = view.visualViewport;
    node.addEventListener('toggle', attention);
    document.addEventListener('visibilitychange', attention);
    document.fonts?.addEventListener('loadingdone', attention);
    for (const target of focusTargets) {
      target.addEventListener('focusin', attention, true);
      target.addEventListener('focusout', schedule, true);
    }
    view.addEventListener('focus', attention);
    view.addEventListener('blur', attention);
    view.addEventListener('resize', schedule);
    view.addEventListener('scroll', externalScroll, true);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    return () => {
      visibilityRef.current = undefined;
      detach();
      pointerInsideRef.current = false;
      overlay.dispose();
      node.removeEventListener('toggle', attention);
      document.removeEventListener('visibilitychange', attention);
      document.fonts?.removeEventListener('loadingdone', attention);
      for (const target of focusTargets) {
        target.removeEventListener('focusin', attention, true);
        target.removeEventListener('focusout', schedule, true);
      }
      view.removeEventListener('focus', attention);
      view.removeEventListener('blur', attention);
      view.removeEventListener('resize', schedule);
      view.removeEventListener('scroll', externalScroll, true);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
      }
    };
  }, [host, scope, pointerInsideRef, queue, visibilityRef]);

  useIsoLayoutEffect(() => {
    const node = root.current;
    if (!node) {
      return;
    }
    const announcements = announceFromCarrier(
      node,
      queue,
      messages,
      () =>
        node.ownerDocument.visibilityState !== 'hidden' &&
        host === resolveToastPortalHost(scope) &&
        isOpenToastCarrier(node, host) &&
        node.offsetWidth > 0 &&
        node.offsetHeight > 0,
    );
    refreshAnnouncements.current = announcements.refresh;
    announcements.refresh();
    return () => {
      refreshAnnouncements.current = undefined;
      announcements.stop();
    };
  }, [host, messages, queue, scope]);

  useIsoLayoutEffect(() => {
    const node = root.current;
    const view = getLiveView(node?.ownerDocument ?? null);
    if (!node || !view) {
      return;
    }
    const list = node.querySelector<HTMLDivElement>('.unica-toast-list');
    const stack = node.querySelector<HTMLDivElement>('.unica-toast-stack');
    const scrollport = list ?? stack;
    const rows = node.querySelectorAll<HTMLElement>(rowSelector);

    const synchronize = (): void => {
      const next = positionCarrier(node, scope, placement);
      if (next !== edge) {
        setEdge(next);
      }
      if (list) {
        layoutReading(list, node, top, reading.current);
      } else {
        node.style.removeProperty('--_toast-scrollbar-gutter');
      }
      if (stack) {
        const card = stack.querySelector<HTMLElement>('.unica-toast');
        const dock = node.querySelector<HTMLElement>('.unica-toast-dock');
        const dockHeight = dock ? dock.offsetHeight + 10 : 0;
        const plateHeight = Math.min(2, entries.length - 1) * 6;
        const oversized = Boolean(
          card && card.offsetHeight + plateHeight + dockHeight > node.clientHeight + 1,
        );
        stack.toggleAttribute('data-unica-toast-oversized', oversized);
        stack.classList.toggle('unica-scrollbar', !dock || oversized);
      }
      queue.refreshReading();
      refreshAnnouncements.current?.();
    };
    const onScroll = (): void => {
      if (list) {
        rememberReadingPosition(list, top, reading.current);
      }
      queue.refreshReading();
    };
    scrollport?.addEventListener('scroll', onScroll);
    measure.current = synchronize;
    synchronize();

    let frame: number | undefined;
    const observer = new view.ResizeObserver(() => {
      if (frame === undefined) {
        frame = view.requestAnimationFrame(() => {
          frame = undefined;
          synchronize();
        });
      }
    });
    observer.observe(node);
    observer.observe(scope);
    if (scrollport) {
      observer.observe(scrollport);
    }
    for (const row of rows) {
      observer.observe(row);
    }
    return () => {
      measure.current = undefined;
      scrollport?.removeEventListener('scroll', onScroll);
      observer.disconnect();
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
      }
    };
  }, [edge, entries, expanded, front, placement, queue, reading, scope, top]);

  const grouped = entries.length > 1;
  const list = (
    <ToastList
      key="list"
      id={controls}
      entries={entries}
      front={front}
      expanded={expanded}
      top={top}
      messages={messages}
      dismiss={queue.commands.dismiss}
    />
  );
  const dock = grouped && (
    <ToastDock
      key="dock"
      controls={controls}
      count={entries.length}
      expanded={expanded}
      top={top}
      messages={messages}
      clear={queue.commands.dismissAll}
      toggle={toggle}
    />
  );
  return (
    <div
      {...pickConsumerDataAttributes(attributes, 'data-unica-toast-')}
      ref={combinedRef}
      id={id}
      className={cx('unica-toast-viewport', className)}
      style={style}
      popover="manual"
      role="region"
      aria-label={messages.regionLabel}
      data-unica-toast-placement={placement}
      data-unica-toast-edge={edge}
      data-unica-toast-grouped={dataFlag(grouped)}
      data-unica-toast-expanded={dataFlag(expanded)}
      onKeyDownCapture={(event) => {
        if (
          event.repeat &&
          (event.key === 'Enter' || event.key === ' ') &&
          (event.target as Element).matches('button')
        ) {
          event.preventDefault();
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          pointerInsideRef.current = true;
          if (!expanded) {
            hold(front.id);
          }
          queue.refreshReading();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') {
          pointerInsideRef.current = false;
          if (!composedContains(event.currentTarget, getToastActiveElement(event.currentTarget))) {
            hold(null);
          }
          queue.refreshReading();
        }
      }}
      onFocusCapture={(event) => {
        const node = event.currentTarget;
        const target = event.target;
        recordToastFocus(focus.current, node, target, event.relatedTarget);
        if (!expanded) {
          hold(front.id);
        }
        const scrollport = target.closest<HTMLElement>('.unica-toast-list, .unica-toast-stack');
        if (
          scrollport &&
          target !== scrollport &&
          target.matches(':focus-visible') &&
          !focus.current.restoring
        ) {
          revealReadingControl(scrollport, target);
        }
        queue.refreshReading();
      }}
      onBlurCapture={(event) => {
        if (
          !composedContains(event.currentTarget, event.relatedTarget) &&
          !pointerInsideRef.current
        ) {
          hold(null);
        }
      }}
    >
      {top ? [dock, list] : [list, dock]}
      <span className="unica-visually-hidden" role="status" aria-atomic="true" />
      <span className="unica-visually-hidden" role="alert" aria-atomic="true" />
    </div>
  );
}

/** Projects the nearest queue into its available native top-layer host. */
export function ToastViewport({
  placement = 'bottom-end',
  ref,
  fallbackFocusRef,
  ...attributes
}: ToastViewportProps): ReactElement | null {
  const { messages, queue } = useToastOwner();
  const [identity] = useState(() => Symbol('toast viewport'));
  const [expanded, expand] = useState(false);
  const [held, hold] = useState<ToastId | null>(null);
  const pointerInsideRef = useRef(false);
  const focus = useRef<ToastFocus>({ origin: null, current: null, restoring: false });
  const reading = useRef<ReadingPosition>({ pinned: true, anchor: undefined, max: 0 });
  const root = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<() => void>(undefined);
  const combinedRef = useMemo(() => mergeRefs(root, ref), [ref]);

  useInsertionEffect(() => queue.registerViewport(identity), [queue, identity]);
  const active =
    useSyncExternalStore(queue.subscribe, queue.getActiveViewport, noViewport) === identity;
  const entries = useSyncExternalStore(queue.subscribe, queue.getSnapshot, noEntries);
  const scope = usePortalContainer();
  const selection = useToastHost(active && entries.length > 0 ? scope : null, root, visibilityRef);
  const host = selection?.host ?? null;
  const document = scope?.ownerDocument;
  const grouped = entries.length > 1;
  const front = (!expanded && held && entries.find((item) => item.id === held)) || entries.at(-1);

  useIsoLayoutEffect(() => {
    if (!document || !active) {
      return;
    }
    const observeFocus = (): void => {
      const next = root.current
        ? getToastActiveElement(root.current)
        : getDeepActiveElement(document);
      if (
        next &&
        next !== document.body &&
        next !== document.documentElement &&
        (!root.current || !composedContains(root.current, next))
      ) {
        focus.current.current = null;
        focus.current.origin = next;
        if (!pointerInsideRef.current) {
          hold(null);
        }
      }
    };
    const observeOutsidePointer = (event: PointerEvent): void => {
      const node = root.current;
      const path = event.composedPath();
      const target = path[0];
      const retargetedInside =
        node &&
        isElementNode(target) &&
        composedContains(target, node) &&
        composedContains(node, toastHitTarget(node, event.clientX, event.clientY));
      if (!node || (!path.includes(node) && !retargetedInside)) {
        focus.current.current = null;
      }
    };
    const physicalRoot = host ? getRootNodeSafe(host) : document;
    physicalRoot.addEventListener('focusin', observeFocus);
    if (physicalRoot !== document) {
      document.addEventListener('focusin', observeFocus);
    }
    document.addEventListener('pointerdown', observeOutsidePointer, true);
    return () => {
      physicalRoot.removeEventListener('focusin', observeFocus);
      document.removeEventListener('focusin', observeFocus);
      document.removeEventListener('pointerdown', observeOutsidePointer, true);
    };
  }, [active, document, host]);

  useIsoLayoutEffect(() => {
    if (!grouped && expanded) {
      expand(false);
    }
    if (!active) {
      return;
    }
    const node = root.current;
    if (!node || (host && isOpenToastCarrier(node, host))) {
      restoreToastFocus(
        focus.current,
        node,
        entries.length === 0,
        fallbackFocusRef?.current ?? null,
      );
    }
  });

  if (!host || !scope || !front) {
    return null;
  }
  return (
    <Portal container={host}>
      <ToastCarrier
        {...attributes}
        key={selection?.generation}
        ref={combinedRef}
        host={host}
        scope={scope}
        placement={placement}
        queue={queue}
        entries={entries}
        front={front}
        messages={messages}
        expanded={expanded && grouped}
        hold={hold}
        toggle={() => {
          reading.current = { pinned: true, anchor: undefined, max: 0 };
          hold(expanded ? (entries.at(-1)?.id ?? null) : null);
          expand(!expanded);
        }}
        reading={reading}
        focus={focus}
        pointerInsideRef={pointerInsideRef}
        visibilityRef={visibilityRef}
      />
    </Portal>
  );
}

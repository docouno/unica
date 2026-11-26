import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, Ref, RefCallback } from 'react';
import {
  composedContains,
  containsSafe,
  documentHasFocusSafe,
  getDeepActiveElement,
  getDocumentBody,
  getOwnerDocument,
  getRootActiveElement,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
  matchesSafe,
} from '../dom.js';
import {
  hasPendingFocusTransfer,
  isExplicitBlurInProgress,
  isLiveFocusElement,
  recoverAfterFocusTransfer,
} from '../focus-transfer.js';
import type { FocusTransfer } from '../focus-transfer.js';
import { mergeRefs } from '../mergeRefs.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { findNavigable, isNavigable, recoverRovingKey } from './navigation.js';
import type { CollectionItem } from './navigation.js';
import { useCollectionNavigation } from './useCollectionNavigation.js';
import type { CollectionNavigationOptions } from './useCollectionNavigation.js';

export interface RovingFocusOptions extends Omit<CollectionNavigationOptions, 'activeKey'> {
  readonly recoveryKey?: string | null | undefined;
  readonly resolveRecoveryKey?:
    ((missingKey: string, previous: readonly CollectionItem[]) => string | null) | undefined;
  readonly onRecoveryFallback?:
    ((document: Document, canRecover: () => boolean) => void) | undefined;
  readonly onNavigate?: ((key: string) => void) | undefined;
  readonly focusOptions?: FocusOptions | undefined;
  /** A committed-DOM collection can publish after a child attaches or detaches. */
  readonly itemsFromDOM?: boolean | undefined;
}

export interface RovingItemUserProps<T extends HTMLElement> {
  readonly ref?: Ref<T> | undefined;
  readonly onFocus?: ((event: FocusEvent<T>) => void) | undefined;
}

export interface RovingItemProps<T extends HTMLElement> {
  ref: RefCallback<T>;
  tabIndex: 0 | -1;
  onFocus: (event: FocusEvent<T>) => void;
}

export interface RovingFocus<T extends HTMLElement> {
  tabStop: string | null;
  focusedKey: string | null;
  getItemKey: (target: EventTarget | null) => string | null;
  getItemProps: (key: string, userProps?: RovingItemUserProps<T>) => RovingItemProps<T>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  captureFocusTransfer: (target: Element, transfer: FocusTransfer) => boolean;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  clearTypeahead: () => void;
}

interface FocusOrigin<T extends HTMLElement> {
  readonly key: string;
  readonly node: T;
  readonly root: Node;
  departure: FocusTransfer | null | undefined;
  pendingItems: readonly CollectionItem[] | null;
}

type FocusHandler<T extends HTMLElement> = (event: FocusEvent<T>) => void;

function acceptedFocus(target: HTMLElement, root: Node, doc: Document): boolean {
  if (getRootActiveElement(root, doc) === target) {
    return true;
  }
  const deep = getDeepActiveElement(doc);
  return deep !== null && composedContains(target, deep);
}

function canRecoverFocus(
  root: Node,
  doc: Document,
  originNode: HTMLElement,
  unavailable: Element | null = null,
): boolean {
  if (!documentHasFocusSafe(doc)) {
    return false;
  }
  if (acceptedFocus(originNode, root, doc)) {
    return true;
  }
  const active = getDeepActiveElement(doc, root) ?? getDeepActiveElement(doc);
  return (
    active === null ||
    active === getDocumentBody(doc) ||
    active === unavailable ||
    !isLiveFocusElement(active)
  );
}

export function useRovingFocus<T extends HTMLElement>(options: RovingFocusOptions): RovingFocus<T> {
  const { items, entryKey } = options;
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const focused = useRef<FocusOrigin<T> | null>(null);
  const focusSequence = useRef(0);
  const previous = useRef(items);
  const optionsRef = useRef(options);
  const committing = useRef(false);
  const navigating = useRef(false);
  const [maps] = useState(() => ({
    nodes: new Map<string, T>(),
    nodeKeys: new WeakMap<Element, string>(),
    canceledFocus: new WeakSet<T>(),
    refCallbacks: new Map<string, RefCallback<T>>(),
    focusHandlers: new Map<string, FocusHandler<T>>(),
    mergedRefs: new Map<
      string,
      { userRef: Ref<T>; baseRef: RefCallback<T>; merged: RefCallback<T> }
    >(),
    composedFocus: new Map<
      string,
      { userOnFocus: FocusHandler<T>; baseFocus: FocusHandler<T>; composed: FocusHandler<T> }
    >(),
  }));

  const current = findNavigable(items, focusedKey);
  const tabStop =
    current?.key ?? (findNavigable(items, entryKey) ?? items.find(isNavigable))?.key ?? null;

  const { onKeyDown: navigateKeyDown, clearTypeahead } = useCollectionNavigation(
    { ...options, activeKey: tabStop },
    (key) => {
      const target = maps.nodes.get(key);
      if (!target) {
        return;
      }
      const doc = getOwnerDocument(target);
      if (!doc) {
        return;
      }
      const root = getRootNodeSafe(target);
      navigating.current = true;
      try {
        target.focus(optionsRef.current.focusOptions);
        if (acceptedFocus(target, root, doc)) {
          optionsRef.current.onNavigate?.(key);
        }
      } finally {
        navigating.current = false;
      }
    },
  );

  const clearStrandedFocus = useCallback(
    (origin: FocusOrigin<T>): void => {
      queueMicrotask(() => {
        if (focused.current !== origin) {
          return;
        }
        const doc = getOwnerDocument(origin.node);
        if (doc && documentHasFocusSafe(doc) && acceptedFocus(origin.node, origin.root, doc)) {
          return;
        }
        // A local child commit can strand focus before the DOM collection has
        // rendered its new snapshot. Keep that origin for the recovery pass.
        if (
          doc &&
          optionsRef.current.itemsFromDOM &&
          origin.departure !== null &&
          !isExplicitBlurInProgress(origin.departure) &&
          canRecoverFocus(origin.root, doc, origin.node) &&
          (maps.nodes.get(origin.key) !== origin.node ||
            !isConnectedNode(origin.node) ||
            matchesSafe(origin.node, ':disabled'))
        ) {
          return;
        }
        focused.current = null;
        setFocusedKey(null);
        clearTypeahead();
      });
    },
    [clearTypeahead, maps],
  );

  // Publish before child refs, autoFocus, or child layout effects run, and mark
  // the commitMutationEffects window so DOM-mutation blurs are not treated as user blurs.
  useInsertionEffect(() => {
    committing.current = true;
    optionsRef.current = options;
  });

  useIsoLayoutEffect(() => {
    committing.current = false;
    const before = previous.current;
    previous.current = items;

    if (
      maps.refCallbacks.size > items.length ||
      maps.focusHandlers.size > items.length ||
      maps.mergedRefs.size > items.length ||
      maps.composedFocus.size > items.length
    ) {
      const liveKeys = new Set<string>();
      for (const item of items) {
        liveKeys.add(item.key);
      }
      for (const key of maps.refCallbacks.keys()) {
        if (!liveKeys.has(key) && !maps.nodes.has(key)) {
          maps.refCallbacks.delete(key);
        }
      }
      for (const key of maps.focusHandlers.keys()) {
        if (!liveKeys.has(key) && !maps.nodes.has(key)) {
          maps.focusHandlers.delete(key);
        }
      }
      for (const key of maps.mergedRefs.keys()) {
        if (!liveKeys.has(key) && !maps.nodes.has(key)) {
          maps.mergedRefs.delete(key);
        }
      }
      for (const key of maps.composedFocus.keys()) {
        if (!liveKeys.has(key) && !maps.nodes.has(key)) {
          maps.composedFocus.delete(key);
        }
      }
    }

    const origin = focused.current;
    if (!origin) {
      return;
    }

    const doc = getOwnerDocument(origin.node);
    if (!doc) {
      return;
    }
    const stillFocused = acceptedFocus(origin.node, origin.root, doc);
    const lost = !findNavigable(items, origin.key);
    const replacement = maps.nodes.get(origin.key);
    // With a committed DOM collection, React can detach the item one layout phase
    // before the collection publishes the new order. Keep the origin for that pass.
    const waitingForRegistration = origin.pendingItems === items;
    const waitingForAvailability =
      options.itemsFromDOM &&
      !lost &&
      (replacement === undefined || matchesSafe(replacement, ':disabled'));
    if (waitingForRegistration || waitingForAvailability) {
      clearStrandedFocus(origin);
      return;
    }
    origin.pendingItems = null;
    const replaced = replacement !== origin.node;
    const orderChanged =
      !lost &&
      !replaced &&
      !stillFocused &&
      before !== items &&
      (before.length !== items.length ||
        before.some(({ key }, index) => key !== items[index]?.key));
    const needsRecovery = lost || replaced || orderChanged;
    if (!needsRecovery) {
      return;
    }

    recoverAfterFocusTransfer(origin.departure, (unavailable) => {
      const canRecover = (): boolean => canRecoverFocus(origin.root, doc, origin.node, unavailable);
      if (!canRecover()) {
        return;
      }
      const latest = optionsRef.current;
      const available = latest.readItems?.() ?? latest.items;
      const missing = !findNavigable(available, origin.key);
      const target = missing
        ? latest.resolveRecoveryKey
          ? latest.resolveRecoveryKey(origin.key, before)
          : recoverRovingKey(available, before, origin.key, latest.recoveryKey)
        : origin.key;
      const node = target === null ? undefined : maps.nodes.get(target);
      node?.focus(latest.focusOptions);
      if (
        missing &&
        latest.onRecoveryFallback &&
        (!node || !acceptedFocus(node, getRootNodeSafe(node), doc)) &&
        canRecover()
      ) {
        latest.onRecoveryFallback(doc, canRecover);
      }
    });
    if (
      focused.current === origin &&
      (lost || !documentHasFocusSafe(doc) || !acceptedFocus(origin.node, origin.root, doc))
    ) {
      focused.current = null;
      setFocusedKey(null);
      clearTypeahead();
    }
  });

  const trackFocus = useCallback(
    (key: string, node: T): void => {
      const { items: listedItems, itemsFromDOM } = optionsRef.current;
      const navigable = findNavigable(listedItems, key) !== undefined;
      const pending = !navigable && itemsFromDOM && !matchesSafe(node, ':disabled');
      if (!navigable && !pending) {
        focused.current = null;
        setFocusedKey(null);
        clearTypeahead();
        return;
      }
      if (!navigating.current && focused.current?.key !== key) {
        clearTypeahead();
      }
      focused.current = {
        key,
        node,
        root: getRootNodeSafe(node),
        departure: undefined,
        pendingItems: pending ? listedItems : null,
      };
      setFocusedKey(key);
    },
    [clearTypeahead],
  );

  const getBaseRef = useCallback(
    (key: string): RefCallback<T> => {
      let callback = maps.refCallbacks.get(key);
      if (!callback) {
        callback = (node: T | null) => {
          if (!node) {
            return;
          }
          maps.nodes.set(key, node);
          maps.nodeKeys.set(node, key);
          // A server-rendered control may already own focus when React attaches.
          if (
            optionsRef.current.itemsFromDOM &&
            focused.current?.node !== node &&
            !maps.canceledFocus.has(node)
          ) {
            const doc = getOwnerDocument(node);
            if (doc && acceptedFocus(node, getRootNodeSafe(node), doc)) {
              trackFocus(key, node);
            }
          }
          return () => {
            const origin = focused.current;
            if (origin?.node === node && isExplicitBlurInProgress(origin.departure)) {
              // The child can detach before the collection publishes. Keep
              // the explicit departure when the browser event has finished.
              origin.departure = null;
            }
            if (maps.nodes.get(key) === node) {
              maps.nodes.delete(key);
            }
          };
        };
        maps.refCallbacks.set(key, callback);
      }
      return callback;
    },
    [maps, trackFocus],
  );

  const getBaseFocus = useCallback(
    (key: string): FocusHandler<T> => {
      let handler = maps.focusHandlers.get(key);
      if (!handler) {
        handler = (event: FocusEvent<T>) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          const node = event.currentTarget;
          focusSequence.current += 1;
          const doc = getOwnerDocument(node);
          if (!doc || !acceptedFocus(node, getRootNodeSafe(node), doc)) {
            return;
          }
          if (event.defaultPrevented) {
            maps.canceledFocus.add(node);
            if (focused.current) {
              focused.current = null;
              setFocusedKey(null);
              clearTypeahead();
            }
            return;
          }
          maps.canceledFocus.delete(node);
          trackFocus(key, node);
        };
        maps.focusHandlers.set(key, handler);
      }
      return handler;
    },
    [clearTypeahead, maps, trackFocus],
  );

  const getItemProps = useCallback(
    (key: string, userProps?: RovingItemUserProps<T>): RovingItemProps<T> => {
      const baseRef = getBaseRef(key);
      const baseFocus = getBaseFocus(key);

      let ref: RefCallback<T> = baseRef;
      const userRef = userProps?.ref;
      if (userRef) {
        const cached = maps.mergedRefs.get(key);
        if (cached && cached.userRef === userRef && cached.baseRef === baseRef) {
          ref = cached.merged;
        } else {
          const merged = mergeRefs(baseRef, userRef);
          maps.mergedRefs.set(key, { userRef, baseRef, merged });
          ref = merged;
        }
      }

      let onFocus: FocusHandler<T> = baseFocus;
      const userOnFocus = userProps?.onFocus;
      if (userOnFocus) {
        const cached = maps.composedFocus.get(key);
        if (cached && cached.userOnFocus === userOnFocus && cached.baseFocus === baseFocus) {
          onFocus = cached.composed;
        } else {
          const composed = (event: FocusEvent<T>): void => {
            const sequence = focusSequence.current;
            userOnFocus(event);
            if (focusSequence.current === sequence) {
              baseFocus(event);
            }
          };
          maps.composedFocus.set(key, { userOnFocus, baseFocus, composed });
          onFocus = composed;
        }
      }

      return {
        tabIndex: key === tabStop ? 0 : -1,
        ref,
        onFocus,
      };
    },
    [getBaseFocus, getBaseRef, maps, tabStop],
  );

  const getItemKey = useCallback(
    (target: EventTarget | null): string | null => {
      const key = isElementNode(target) ? maps.nodeKeys.get(target) : undefined;
      return key !== undefined && maps.nodes.get(key) === target ? key : null;
    },
    [maps],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const targetKey = getItemKey(event.target);
      if (event.target !== event.currentTarget && targetKey === null) {
        return;
      }

      navigateKeyDown(event, targetKey ?? focused.current?.key ?? null);
    },
    [getItemKey, navigateKeyDown],
  );

  const captureFocusTransfer = useCallback(
    (target: Element, transfer: FocusTransfer): boolean => {
      const origin = focused.current;
      if (
        origin &&
        (composedContains(origin.node, target) || composedContains(target, origin.node)) &&
        (transfer.destination !== null ||
          (!committing.current &&
            isConnectedNode(origin.node) &&
            maps.nodes.get(origin.key) === origin.node &&
            !matchesSafe(origin.node, ':disabled')))
      ) {
        origin.departure = transfer;
        return true;
      }
      return false;
    },
    [maps],
  );

  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>): void => {
      const origin = focused.current;
      let destination = event.relatedTarget;
      if (origin) {
        // A target or ancestor handler can establish a new origin before this
        // blur reaches the list. Only the origin that blurred can be released.
        if (!composedContains(origin.node, event.target)) {
          return;
        }
        const doc = getOwnerDocument(origin.node);
        if (doc && acceptedFocus(origin.node, origin.root, doc)) {
          // Refocusing the same node can also supersede the old blur.
          clearStrandedFocus(origin);
          return;
        }
        if (doc) {
          const active = getDeepActiveElement(doc, origin.root) ?? getDeepActiveElement(doc);
          if (active && active !== getDocumentBody(doc)) {
            destination = active;
          } else if (origin.departure?.destination && hasPendingFocusTransfer(origin.departure)) {
            // relatedTarget only describes the candidate while focusout is
            // running. Keep the origin if a child already dropped its ref.
            clearStrandedFocus(origin);
            return;
          }
        }
      }
      if (containsSafe(event.currentTarget, destination)) {
        const relatedKey = isElementNode(destination) ? maps.nodeKeys.get(destination) : undefined;
        if (
          relatedKey !== undefined &&
          maps.nodes.get(relatedKey) === destination &&
          findNavigable(optionsRef.current.items, relatedKey)
        ) {
          return;
        }
        focused.current = null;
        setFocusedKey(null);
        clearTypeahead();
        return;
      }

      if (destination === null && origin) {
        if (
          isExplicitBlurInProgress(origin.departure) ||
          (!committing.current &&
            maps.nodes.get(origin.key) === origin.node &&
            isConnectedNode(origin.node) &&
            !matchesSafe(origin.node, ':disabled'))
        ) {
          origin.departure = null;
        }
        // Removal or reorder can blur without a related target. Layout gets the first
        // chance to distinguish it from an ordinary or window blur and recover focus.
        clearStrandedFocus(origin);
        return;
      }

      focused.current = null;
      setFocusedKey(null);
      clearTypeahead();
    },
    [clearStrandedFocus, clearTypeahead, maps],
  );

  return {
    tabStop,
    focusedKey: current?.key ?? null,
    getItemKey,
    getItemProps,
    onKeyDown,
    captureFocusTransfer,
    onBlur,
    clearTypeahead,
  };
}

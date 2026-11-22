import { useCallback, useInsertionEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, Ref, RefCallback } from 'react';
import { composeEventHandlers } from '../composeEventHandlers.js';
import {
  composedContains,
  containsSafe,
  documentHasFocusSafe,
  getDeepActiveElement,
  getDocumentActiveElement,
  getDocumentBody,
  getOwnerDocument,
  getRootActiveElement,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
  matchesSafe,
} from '../dom.js';
import { mergeRefs } from '../mergeRefs.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { findNavigable, isNavigable, recoverRovingKey } from './navigation.js';
import { useCollectionNavigation } from './useCollectionNavigation.js';
import type { CollectionNavigationOptions } from './useCollectionNavigation.js';

export interface RovingFocusOptions extends Omit<CollectionNavigationOptions, 'activeKey'> {
  readonly recoveryKey?: string | null | undefined;
  readonly onNavigate?: ((key: string) => void) | undefined;
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
  getItemProps: (key: string, userProps?: RovingItemUserProps<T>) => RovingItemProps<T>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  clearTypeahead: () => void;
}

type FocusHandler<T extends HTMLElement> = (event: FocusEvent<T>) => void;

function acceptedFocus(target: HTMLElement, root: Node, doc: Document): boolean {
  if (getRootActiveElement(root, doc) === target) {
    return true;
  }
  const deep = getDeepActiveElement(doc);
  return deep !== null && composedContains(target, deep);
}

function canRecoverFocus(root: Node, doc: Document, originNode: HTMLElement): boolean {
  if (!documentHasFocusSafe(doc)) {
    return false;
  }
  if (acceptedFocus(originNode, root, doc)) {
    return true;
  }
  const active = getRootActiveElement(root, doc);
  if (root === doc) {
    return active === getDocumentBody(doc) || active === null;
  }
  // Inside Shadow DOM, shadowRoot.activeElement is null whenever focus lives outside
  // the shadow tree (for example an external input or iframe). Only recover if document
  // focus itself was stranded on body/null.
  if (active !== null) {
    return false;
  }
  const docActive = getDocumentActiveElement(doc);
  return docActive === getDocumentBody(doc) || docActive === null;
}

export function useRovingFocus<T extends HTMLElement>(options: RovingFocusOptions): RovingFocus<T> {
  const { items, entryKey, recoveryKey } = options;
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const focused = useRef<{
    key: string;
    node: T;
    root: Node;
    blurredWhileLive: boolean;
  } | null>(null);
  const previous = useRef(items);
  const optionsRef = useRef(options);
  const committing = useRef(false);
  const navigating = useRef(false);
  const [maps] = useState(() => ({
    nodes: new Map<string, T>(),
    nodeKeys: new WeakMap<Element, string>(),
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
        target.focus();
        if (acceptedFocus(target, root, doc)) {
          optionsRef.current.onNavigate?.(key);
        }
      } finally {
        navigating.current = false;
      }
    },
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
    const replaced = maps.nodes.get(origin.key) !== origin.node;
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

    const target = lost ? recoverRovingKey(items, before, origin.key, recoveryKey) : origin.key;
    if (
      target !== null &&
      !origin.blurredWhileLive &&
      canRecoverFocus(origin.root, doc, origin.node)
    ) {
      maps.nodes.get(target)?.focus();
    }
    if (
      focused.current === origin &&
      (lost || !documentHasFocusSafe(doc) || !acceptedFocus(origin.node, origin.root, doc))
    ) {
      focused.current = null;
      setFocusedKey(null);
      clearTypeahead();
    }
  });

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
          return () => {
            if (maps.nodes.get(key) === node) {
              maps.nodes.delete(key);
            }
          };
        };
        maps.refCallbacks.set(key, callback);
      }
      return callback;
    },
    [maps],
  );

  const getBaseFocus = useCallback(
    (key: string): FocusHandler<T> => {
      let handler = maps.focusHandlers.get(key);
      if (!handler) {
        handler = (event: FocusEvent<T>) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (findNavigable(optionsRef.current.items, key)) {
            const node = event.currentTarget;
            if (!navigating.current && focused.current?.key !== key) {
              clearTypeahead();
            }
            focused.current = {
              key,
              node,
              root: getRootNodeSafe(node),
              blurredWhileLive: false,
            };
            setFocusedKey(key);
          } else {
            focused.current = null;
            setFocusedKey(null);
            clearTypeahead();
          }
        };
        maps.focusHandlers.set(key, handler);
      }
      return handler;
    },
    [clearTypeahead, maps],
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
          const composed = composeEventHandlers(userOnFocus, baseFocus);
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

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const target = isElementNode(event.target) ? event.target : null;
      const isContainer = target === event.currentTarget;
      const targetKey = target ? maps.nodeKeys.get(target) : undefined;
      const isRegisteredItem = targetKey !== undefined && maps.nodes.get(targetKey) === target;
      if (!isContainer && !isRegisteredItem) {
        return;
      }

      let activeKey: string | null = focused.current?.key ?? null;
      if (activeKey === null && isRegisteredItem && targetKey !== undefined) {
        activeKey = findNavigable(optionsRef.current.items, targetKey)?.key ?? null;
      }
      navigateKeyDown(event, activeKey);
    },
    [maps, navigateKeyDown],
  );

  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>): void => {
      const related = event.relatedTarget;
      if (containsSafe(event.currentTarget, related)) {
        const relatedKey = isElementNode(related) ? maps.nodeKeys.get(related) : undefined;
        if (
          relatedKey !== undefined &&
          maps.nodes.get(relatedKey) === related &&
          findNavigable(optionsRef.current.items, relatedKey)
        ) {
          return;
        }
        focused.current = null;
        setFocusedKey(null);
        clearTypeahead();
        return;
      }

      const origin = focused.current;
      if (related === null && origin) {
        if (
          !committing.current &&
          isConnectedNode(origin.node) &&
          !matchesSafe(origin.node, ':disabled')
        ) {
          origin.blurredWhileLive = true;
        }
        // Removal or reorder can blur without a related target. Layout gets the first
        // chance to distinguish it from an ordinary or window blur and recover focus.
        queueMicrotask(() => {
          const doc = getOwnerDocument(origin.node);
          if (
            focused.current === origin &&
            (!doc || !documentHasFocusSafe(doc) || !acceptedFocus(origin.node, origin.root, doc))
          ) {
            focused.current = null;
            setFocusedKey(null);
            clearTypeahead();
          }
        });
        return;
      }

      focused.current = null;
      setFocusedKey(null);
      clearTypeahead();
    },
    [clearTypeahead, maps],
  );

  return {
    tabStop,
    getItemProps,
    onKeyDown,
    onBlur,
    clearTypeahead,
  };
}

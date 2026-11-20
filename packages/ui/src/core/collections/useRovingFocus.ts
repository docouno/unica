import { useCallback, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, Ref, RefCallback } from 'react';
import { composeEventHandlers } from '../composeEventHandlers.js';
import {
  documentHasFocusSafe,
  getDocumentActiveElement,
  getDocumentBody,
  getOwnerDocument,
  getRootActiveElement,
  getRootNodeSafe,
} from '../forms/dom.js';
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

function canRecoverFocus(root: Node, doc: Document, originNode: HTMLElement): boolean {
  if (!documentHasFocusSafe(doc)) {
    return false;
  }
  const active = getRootActiveElement(root, doc);
  if (active === originNode) {
    return true;
  }
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
  const navigating = useRef(false);
  const [maps] = useState(() => ({
    nodes: new Map<string, T>(),
    nodeKeys: new WeakMap<Element, string>(),
    refCallbacks: new Map<string, RefCallback<T>>(),
    focusHandlers: new Map<string, (event: FocusEvent<T>) => void>(),
  }));

  const current = findNavigable(items, focusedKey);
  const tabStop =
    current?.key ?? (findNavigable(items, entryKey) ?? items.find(isNavigable))?.key ?? null;

  const navigation = useCollectionNavigation({ ...options, activeKey: tabStop }, (key) => {
    const target = maps.nodes.get(key);
    if (!target) {
      return;
    }
    navigating.current = true;
    try {
      target.focus();
      optionsRef.current.onNavigate?.(key);
    } finally {
      navigating.current = false;
    }
  });

  useIsoLayoutEffect(() => {
    optionsRef.current = options;
    const before = previous.current;
    previous.current = items;
    const origin = focused.current;
    if (!origin) {
      return;
    }

    const doc = getOwnerDocument(origin.node) ?? origin.node.ownerDocument;
    const active = getRootActiveElement(origin.root, doc);
    const lost = !findNavigable(items, origin.key);
    const replaced = maps.nodes.get(origin.key) !== origin.node;
    const orderChanged =
      !lost &&
      !replaced &&
      active !== origin.node &&
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
      !(lost && origin.blurredWhileLive) &&
      canRecoverFocus(origin.root, doc, origin.node)
    ) {
      maps.nodes.get(target)?.focus();
    }
    if (
      focused.current === origin &&
      (lost || !documentHasFocusSafe(doc) || getRootActiveElement(origin.root, doc) !== origin.node)
    ) {
      focused.current = null;
      setFocusedKey(null);
      navigation.clearTypeahead();
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
          maps.refCallbacks.set(key, callback!);
          return () => {
            if (maps.nodes.get(key) === node) {
              maps.nodes.delete(key);
              maps.refCallbacks.delete(key);
              maps.focusHandlers.delete(key);
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
    (key: string): ((event: FocusEvent<T>) => void) => {
      let handler = maps.focusHandlers.get(key);
      if (!handler) {
        handler = (event: FocusEvent<T>) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (findNavigable(optionsRef.current.items, key)) {
            const node = event.currentTarget;
            if (!navigating.current && focused.current?.key !== key) {
              navigation.clearTypeahead();
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
            navigation.clearTypeahead();
          }
        };
        maps.focusHandlers.set(key, handler);
      }
      return handler;
    },
    [maps, navigation],
  );

  const getItemProps = useCallback(
    (key: string, userProps?: RovingItemUserProps<T>): RovingItemProps<T> => {
      const baseRef = getBaseRef(key);
      const baseFocus = getBaseFocus(key);
      return {
        tabIndex: key === tabStop ? 0 : -1,
        ref: userProps?.ref ? mergeRefs(baseRef, userProps.ref) : baseRef,
        onFocus: userProps?.onFocus
          ? composeEventHandlers(userProps.onFocus, baseFocus)
          : baseFocus,
      };
    },
    [getBaseFocus, getBaseRef, tabStop],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const target = event.target as Element | null;
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
      navigation.onKeyDown(event, activeKey);
    },
    [maps, navigation],
  );

  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>): void => {
      const related = event.relatedTarget;
      if (related && event.currentTarget.contains(related)) {
        const relatedKey = maps.nodeKeys.get(related);
        if (
          relatedKey !== undefined &&
          maps.nodes.get(relatedKey) === related &&
          findNavigable(optionsRef.current.items, relatedKey)
        ) {
          return;
        }
        focused.current = null;
        setFocusedKey(null);
        navigation.clearTypeahead();
        return;
      }

      const origin = focused.current;
      if (related === null && origin) {
        if (origin.node.isConnected && !origin.node.matches(':disabled')) {
          origin.blurredWhileLive = true;
        }
        // Removal or reorder can blur without a related target. Layout gets the first
        // chance to distinguish it from an ordinary or window blur and recover focus.
        queueMicrotask(() => {
          const doc = getOwnerDocument(origin.node) ?? origin.node.ownerDocument;
          if (
            focused.current === origin &&
            (!documentHasFocusSafe(doc) || getRootActiveElement(origin.root, doc) !== origin.node)
          ) {
            focused.current = null;
            setFocusedKey(null);
            navigation.clearTypeahead();
          }
        });
        return;
      }

      focused.current = null;
      setFocusedKey(null);
      navigation.clearTypeahead();
    },
    [maps, navigation],
  );

  return {
    tabStop,
    getItemProps,
    onKeyDown,
    onBlur,
    clearTypeahead: navigation.clearTypeahead,
  };
}

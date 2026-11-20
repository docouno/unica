import { useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { findNavigable, isNavigable, recoverRovingKey } from './navigation.js';
import { useCollectionNavigation } from './useCollectionNavigation.js';
import type { CollectionNavigationOptions } from './useCollectionNavigation.js';

interface RovingFocusOptions extends Omit<CollectionNavigationOptions, 'activeKey'> {
  recoveryKey?: string | null;
}

interface RovingItemProps<T extends HTMLElement> {
  ref: (node: T | null) => void;
  tabIndex: 0 | -1;
  onFocus: (event: FocusEvent<T>) => void;
}

interface RovingFocus<T extends HTMLElement> {
  tabStop: string | null;
  getItemProps: (key: string) => RovingItemProps<T>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

function activeElement(root: Node, document: Document): Element | null {
  return 'activeElement' in root
    ? (root as Document | ShadowRoot).activeElement
    : document.activeElement;
}

export function useRovingFocus<T extends HTMLElement>(options: RovingFocusOptions): RovingFocus<T> {
  const { items, entryKey, recoveryKey } = options;
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const focused = useRef<{ key: string; node: T; root: Node } | null>(null);
  const previous = useRef(items);
  const nodes = useRef(new Map<string, T>());

  const entry = findNavigable(items, entryKey) ?? items.find(isNavigable);
  const current = findNavigable(items, focusedKey);
  const tabStop = current?.key ?? entry?.key ?? null;

  const navigation = useCollectionNavigation({ ...options, activeKey: tabStop }, (key) => {
    nodes.current.get(key)?.focus();
  });

  useIsoLayoutEffect(() => {
    const before = previous.current;
    previous.current = items;
    const origin = focused.current;
    if (!origin) {
      return;
    }

    const document = origin.node.ownerDocument;
    const active = activeElement(origin.root, document);
    const lost = !findNavigable(items, origin.key);
    const orderChanged =
      before.length !== items.length || before.some(({ key }, index) => key !== items[index]?.key);
    const needsRecovery = lost || (active !== origin.node && orderChanged);
    if (!needsRecovery) {
      return;
    }
    const target = lost ? recoverRovingKey(items, before, origin.key, recoveryKey) : origin.key;
    if (
      target !== null &&
      (active === origin.node || active === document.body || active === null)
    ) {
      nodes.current.get(target)?.focus();
    }
    if (
      focused.current === origin &&
      (lost || activeElement(origin.root, document) !== origin.node)
    ) {
      focused.current = null;
      setFocusedKey(null);
      navigation.clearTypeahead();
    }
  });

  return {
    tabStop,
    getItemProps(key) {
      return {
        tabIndex: key === tabStop ? 0 : -1,
        ref(node) {
          if (node) {
            nodes.current.set(key, node);
          } else {
            nodes.current.delete(key);
          }
        },
        onFocus(event) {
          if (findNavigable(items, key)) {
            const node = event.currentTarget;
            focused.current = { key, node, root: node.getRootNode() };
            setFocusedKey(key);
          }
        },
      };
    },
    onKeyDown: navigation.onKeyDown,
    onBlur(event) {
      if (event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      const origin = focused.current;
      if (event.relatedTarget === null && origin) {
        // Removal can blur without a related target. Layout gets the first chance
        // to distinguish it from an ordinary blur and recover the focused key.
        queueMicrotask(() => {
          if (
            focused.current === origin &&
            activeElement(origin.root, origin.node.ownerDocument) !== origin.node
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
  };
}

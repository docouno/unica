import { useCallback, useInsertionEffect, useRef } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { findNavigable } from './navigation.js';
import type { CollectionItem } from './navigation.js';
import { useCollectionNavigation } from './useCollectionNavigation.js';
import type { CollectionNavigationOptions } from './useCollectionNavigation.js';

export interface DescendantItem extends CollectionItem {
  readonly id: string;
}

export interface ActiveDescendantOptions extends Omit<CollectionNavigationOptions, 'items'> {
  readonly items: readonly DescendantItem[];
  readonly open: boolean;
  readonly onActiveChange: (key: string) => void;
}

export interface ActiveDescendant {
  activeKey: string | null;
  'aria-activedescendant': string | undefined;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  clearTypeahead: () => void;
}

export function useActiveDescendant(options: ActiveDescendantOptions): ActiveDescendant {
  const { items, activeKey, open, onActiveChange } = options;
  const active = open ? findNavigable(items, activeKey) : undefined;
  const resolvedKey = active?.key ?? null;
  const openRef = useRef(open);
  const resolvedKeyRef = useRef<string | null>(resolvedKey);
  const liveActiveKey = useRef<string | null>(resolvedKey);
  const onActiveChangeRef = useRef(onActiveChange);

  const handleNavigate = useCallback((key: string): void => {
    liveActiveKey.current = key;
    try {
      onActiveChangeRef.current(key);
    } catch (error) {
      liveActiveKey.current = resolvedKeyRef.current;
      throw error;
    } finally {
      // Keep optimistic stepping within a synchronous batch, then reconcile to the
      // committed controlled key if the owner ignored or remapped the proposal.
      queueMicrotask(() => {
        liveActiveKey.current = resolvedKeyRef.current;
      });
    }
  }, []);

  const { onKeyDown: navigateKeyDown, clearTypeahead } = useCollectionNavigation(
    {
      ...options,
      homeEnd: options.homeEnd ?? false,
      activeKey: resolvedKey,
    },
    handleNavigate,
  );

  useInsertionEffect(() => {
    openRef.current = open;
    resolvedKeyRef.current = resolvedKey;
    liveActiveKey.current = resolvedKey;
    onActiveChangeRef.current = onActiveChange;
  }, [open, resolvedKey, onActiveChange]);

  useIsoLayoutEffect(() => {
    if (!open) {
      clearTypeahead();
    }
  }, [open, clearTypeahead]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (openRef.current) {
        navigateKeyDown(event, liveActiveKey.current);
      } else {
        clearTypeahead();
      }
    },
    [clearTypeahead, navigateKeyDown],
  );

  const onBlur = useCallback((): void => {
    clearTypeahead();
  }, [clearTypeahead]);

  return {
    activeKey: resolvedKey,
    'aria-activedescendant': active?.id,
    onKeyDown,
    onBlur,
    clearTypeahead,
  };
}

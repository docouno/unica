import type { FocusEvent, KeyboardEvent } from 'react';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';
import { findNavigable } from './navigation.js';
import type { CollectionItem } from './navigation.js';
import { useCollectionNavigation } from './useCollectionNavigation.js';
import type { CollectionNavigationOptions } from './useCollectionNavigation.js';

interface DescendantItem extends CollectionItem {
  id: string;
}

interface ActiveDescendantOptions extends Omit<CollectionNavigationOptions, 'items'> {
  items: readonly DescendantItem[];
  open: boolean;
  onActiveChange: (key: string) => void;
}

interface ActiveDescendant {
  'aria-activedescendant': string | undefined;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  clearTypeahead: () => void;
}

export function useActiveDescendant(options: ActiveDescendantOptions): ActiveDescendant {
  const { items, activeKey, open, onActiveChange } = options;
  const active = open ? findNavigable(items, activeKey) : undefined;
  const { onKeyDown, clearTypeahead } = useCollectionNavigation(
    { ...options, activeKey: active?.key ?? null },
    onActiveChange,
  );
  useIsoLayoutEffect(() => {
    if (!open) {
      clearTypeahead();
    }
  }, [open, clearTypeahead]);

  return {
    'aria-activedescendant': active?.id,
    onKeyDown(event) {
      if (open) {
        onKeyDown(event);
      } else {
        clearTypeahead();
      }
    },
    onBlur: clearTypeahead,
    clearTypeahead,
  };
}

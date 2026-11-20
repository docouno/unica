import { useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { navigateCollection } from './navigation.js';
import type { NavigationOptions, TypeaheadBuffer } from './navigation.js';

export type CollectionNavigationOptions = Omit<NavigationOptions, 'direction'>;

interface CollectionNavigation {
  onKeyDown: (event: KeyboardEvent<HTMLElement>, activeKey?: string | null) => void;
  clearTypeahead: () => void;
}

export function useCollectionNavigation(
  options: CollectionNavigationOptions,
  onNavigate: (key: string) => void,
): CollectionNavigation {
  const buffer = useRef<TypeaheadBuffer | null>(null);
  const clearTypeahead = useCallback((): void => {
    buffer.current = null;
  }, []);

  return {
    onKeyDown(event, activeKey = options.activeKey) {
      if (event.defaultPrevented) {
        return;
      }
      const { currentTarget, nativeEvent } = event;
      const view = currentTarget.ownerDocument.defaultView;
      const direction = view?.getComputedStyle(currentTarget).direction === 'rtl' ? 'rtl' : 'ltr';
      const result = navigateCollection(
        nativeEvent,
        { ...options, activeKey, direction },
        buffer.current,
        view?.performance.now() ?? Date.now(),
      );
      buffer.current = result.buffer;
      if (result.handled) {
        event.preventDefault();
        if (result.key !== null) {
          onNavigate(result.key);
        }
      }
    },
    clearTypeahead,
  };
}

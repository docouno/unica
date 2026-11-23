import { useCallback, useInsertionEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { markKeyboardNavigation } from '../focus-origin.js';
import { getDefaultView, getOwnerDocument } from '../dom.js';
import { navigateCollection } from './navigation.js';
import type { NavigationOptions, TypeaheadBuffer } from './navigation.js';

export interface CollectionNavigationOptions extends Omit<NavigationOptions, 'direction'> {
  readonly navigateOnCurrent?: boolean | undefined;
}

export interface CollectionNavigation {
  onKeyDown: (event: KeyboardEvent<HTMLElement>, activeKey?: string | null) => void;
  clearTypeahead: () => void;
}

export function useCollectionNavigation(
  options: CollectionNavigationOptions,
  onNavigate: (key: string) => void,
): CollectionNavigation {
  const buffer = useRef<TypeaheadBuffer | null>(null);
  const latest = useRef({ options, onNavigate });

  useInsertionEffect(() => {
    latest.current = { options, onNavigate };
  });

  const clearTypeahead = useCallback((): void => {
    buffer.current = null;
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, activeKeyOverride?: string | null): void => {
      if (event.defaultPrevented) {
        return;
      }
      const { options: currentOptions, onNavigate: navigate } = latest.current;
      const activeKey =
        activeKeyOverride === undefined ? currentOptions.activeKey : activeKeyOverride;
      const { currentTarget, nativeEvent } = event;
      const doc = getOwnerDocument(currentTarget);
      const view = getDefaultView(doc);
      const needsDirection =
        currentOptions.orientation !== 'vertical' &&
        (nativeEvent.key === 'ArrowLeft' || nativeEvent.key === 'ArrowRight');
      const direction =
        needsDirection && view?.getComputedStyle(currentTarget).direction === 'rtl' ? 'rtl' : 'ltr';
      const now = view?.performance?.now() ?? Date.now();
      const result = navigateCollection(
        nativeEvent,
        { ...currentOptions, activeKey, direction },
        buffer.current,
        now,
      );
      buffer.current = result.buffer;
      if (result.handled) {
        event.preventDefault();
        markKeyboardNavigation(currentTarget);
        if (result.key !== null && (result.key !== activeKey || currentOptions.navigateOnCurrent)) {
          navigate(result.key);
        }
      }
    },
    [],
  );

  return useMemo(() => ({ onKeyDown, clearTypeahead }), [onKeyDown, clearTypeahead]);
}

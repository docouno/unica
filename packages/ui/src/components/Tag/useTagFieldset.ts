import { useState } from 'react';
import type { RefObject } from 'react';
import { getLiveView, getLocalName, getParentElementSafe, matchesSafe } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

function fieldsetDisables(element: HTMLElement): boolean {
  for (let parent = getParentElementSafe(element); parent; parent = getParentElementSafe(parent)) {
    if (!matchesSafe(parent, 'fieldset[disabled]')) {
      continue;
    }
    const legend = Array.from(parent.children).find((child) => getLocalName(child) === 'legend');
    if (!legend?.contains(element)) {
      return true;
    }
  }
  return false;
}

// The toolbar and all its actions occupy the same position relative to ancestor fieldsets.
export function useTagFieldset(ref: RefObject<HTMLElement | null>, watch: boolean): boolean {
  const [disabled, setDisabled] = useState(false);

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!watch || !node) {
      setDisabled(false);
      return;
    }

    const sync = (): void => setDisabled(fieldsetDisables(node));
    sync();
    const Observer = getLiveView(node.ownerDocument)?.MutationObserver;
    if (!Observer) {
      return;
    }

    const observeAncestors = (): void => {
      observer.disconnect();
      for (let parent = getParentElementSafe(node); parent; parent = getParentElementSafe(parent)) {
        observer.observe(
          parent,
          getLocalName(parent) === 'fieldset'
            ? { childList: true, attributeFilter: ['disabled'] }
            : { childList: true },
        );
      }
    };
    const observer = new Observer(() => {
      sync();
      observeAncestors();
    });
    observeAncestors();
    return () => observer.disconnect();
  }, [ref, watch]);

  return disabled;
}

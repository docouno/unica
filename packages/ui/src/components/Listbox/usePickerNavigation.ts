import { useId, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { findNavigable, isNavigable, recoverRovingKey } from '../../core/collections/navigation.js';
import { useActiveDescendant } from '../../core/collections/useActiveDescendant.js';
import type { DescendantItem } from '../../core/collections/useActiveDescendant.js';
import { getDefaultView } from '../../core/dom.js';
import { markKeyboardNavigation } from '../../core/focus-origin.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { CollectionEntry, Row } from './collection.js';

export interface VisibleRow extends DescendantItem {
  readonly row: Row;
}

interface Options {
  readonly entries: readonly CollectionEntry[];
  readonly selected: ReadonlySet<string>;
  readonly list: RefObject<HTMLDivElement | null>;
  readonly enabled: boolean;
  readonly focused: boolean;
  readonly typeahead: boolean;
  readonly editing?: boolean | undefined;
  readonly onChoose: (row: Row, host: HTMLElement) => void;
}

export interface PickerNavigation {
  readonly active: string | null;
  readonly activeId: string | undefined;
  readonly rowIds: ReadonlyMap<string, string>;
  readonly enter: () => void;
  readonly activate: (key: string) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

function revealOption(list: HTMLElement, id: string): void {
  const row = list.getRootNode() as Document | ShadowRoot;
  const option = row.getElementById?.(id);
  if (!option || !list.contains(option)) {
    return;
  }
  const rail = list.getBoundingClientRect();
  const box = option.getBoundingClientRect();
  const top = rail.top + list.clientTop;
  const bottom = top + list.clientHeight;
  if (box.top < top || box.height > list.clientHeight) {
    list.scrollTop += box.top - top;
  } else if (box.bottom > bottom) {
    list.scrollTop += box.bottom - bottom;
  }
}

export function usePickerNavigation({
  entries,
  selected,
  list,
  enabled,
  focused,
  typeahead,
  editing,
  onChoose,
}: Options): PickerNavigation {
  const id = useId();
  const items: VisibleRow[] = entries
    .flatMap((entry) => ('options' in entry ? entry.options : [entry]))
    .map((row, index) => ({
      id: row.props?.id || `${id}-option-${index}`,
      key: row.value,
      label: row.label,
      navigable: !row.disabled,
      row,
    }));
  const signature = JSON.stringify(items.map(({ key, navigable }) => [key, navigable]));
  const [previous, setPrevious] = useState({ signature, items });
  const [activeKey, setActive] = useState<string | null>(null);
  const entry =
    items.find((item) => isNavigable(item) && selected.has(item.key)) ?? items.find(isNavigable);
  let active = findNavigable(items, activeKey)?.key;
  if (signature !== previous.signature) {
    setPrevious({ signature, items });
    if (activeKey !== null && active === undefined) {
      const recovered = recoverRovingKey(items, previous.items, activeKey);
      setActive(recovered);
      active = recovered ?? undefined;
    }
  }
  const descendant = useActiveDescendant({
    items,
    activeKey: active ?? entry?.key ?? null,
    entryKey: entry?.key,
    open: enabled,
    orientation: 'vertical',
    wrap: false,
    typeahead,
    homeEnd: !editing,
    onActiveChange: setActive,
  });
  const activeId = descendant['aria-activedescendant'];
  useIsoLayoutEffect(() => {
    const rail = list.current;
    if (!focused || !activeId || !rail) {
      return;
    }
    const reveal = (): void => revealOption(rail, activeId);
    reveal();

    // Overlay positioning can constrain the rail after the initial focus commit.
    const Observer = getDefaultView(rail.ownerDocument)?.ResizeObserver;
    if (Observer) {
      const observer = new Observer(reveal);
      observer.observe(rail);
      return () => observer.disconnect();
    }
  }, [focused, activeId, list]);
  return {
    active: descendant.activeKey,
    activeId,
    rowIds: new Map(items.map((item) => [item.key, item.id])),
    enter() {
      descendant.clearTypeahead();
      setActive(entry?.key ?? null);
    },
    activate: setActive,
    onKeyDown(event) {
      if (!enabled || event.defaultPrevented) {
        return;
      }
      const { key, altKey, ctrlKey, metaKey, shiftKey, nativeEvent } = event;
      if (
        !altKey &&
        !ctrlKey &&
        !metaKey &&
        !shiftKey &&
        !nativeEvent.isComposing &&
        nativeEvent.keyCode !== 229 &&
        (key === 'Enter' || (!editing && key === ' '))
      ) {
        descendant.clearTypeahead();
        event.preventDefault();
        markKeyboardNavigation(event.currentTarget);
        const target = findNavigable(items, descendant.activeKey);
        if (target) {
          onChoose(target.row, event.currentTarget);
        }
        return;
      }
      descendant.onKeyDown(event);
    },
  };
}

export interface CollectionItem {
  key: string;
  label: string;
  navigable?: boolean;
}

export interface NavigationOptions {
  items: readonly CollectionItem[];
  activeKey: string | null;
  entryKey?: string | null | undefined;
  orientation: 'horizontal' | 'vertical' | 'both';
  direction: 'ltr' | 'rtl';
  wrap: boolean;
  typeahead: boolean;
}

export interface TypeaheadBuffer {
  query: string;
  time: number;
}

interface NavigationResult {
  handled: boolean;
  key: string | null;
  buffer: TypeaheadBuffer | null;
}

type NavigationKey = Pick<
  KeyboardEvent,
  'key' | 'defaultPrevented' | 'altKey' | 'ctrlKey' | 'metaKey' | 'isComposing'
>;

export function isNavigable(item: CollectionItem): boolean {
  return item.navigable !== false;
}

export function findNavigable<T extends CollectionItem>(
  items: readonly T[],
  key: string | null | undefined,
): T | undefined {
  return items.find((item) => item.key === key && isNavigable(item));
}

function arrowStep(
  key: string,
  orientation: NavigationOptions['orientation'],
  direction: NavigationOptions['direction'],
): number {
  if (orientation !== 'horizontal') {
    if (key === 'ArrowDown') {
      return 1;
    }
    if (key === 'ArrowUp') {
      return -1;
    }
  }
  if (orientation !== 'vertical') {
    if (key === 'ArrowRight') {
      return direction === 'rtl' ? -1 : 1;
    }
    if (key === 'ArrowLeft') {
      return direction === 'rtl' ? 1 : -1;
    }
  }
  return 0;
}

export function navigateCollection(
  event: NavigationKey,
  options: NavigationOptions,
  buffer: TypeaheadBuffer | null,
  now: number,
): NavigationResult {
  const { activeKey, direction, entryKey, items, orientation, typeahead, wrap } = options;
  const ignored = { handled: false, key: activeKey, buffer };
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.isComposing
  ) {
    return ignored;
  }

  const navigable = items.filter(isNavigable);
  if (navigable.length === 0) {
    return { handled: false, key: null, buffer: null };
  }
  const { key } = event;
  const activeIndex = navigable.findIndex((item) => item.key === activeKey);
  const step = arrowStep(key, orientation, direction);
  if (key === 'Home' || key === 'End') {
    const target = key === 'Home' ? navigable[0] : navigable.at(-1);
    return { handled: true, key: target!.key, buffer: null };
  }
  if (step !== 0) {
    if (activeIndex < 0) {
      const entry = findNavigable(navigable, entryKey);
      const target = entry ?? (step > 0 ? navigable[0] : navigable.at(-1));
      return { handled: true, key: target!.key, buffer: null };
    }
    const nextIndex = activeIndex + step;
    const index = wrap
      ? (nextIndex + navigable.length) % navigable.length
      : Math.max(0, Math.min(nextIndex, navigable.length - 1));
    return { handled: true, key: navigable[index]!.key, buffer: null };
  }

  const previous = buffer && now - buffer.time < 600 ? buffer.query : '';
  if (!typeahead || key === ' ' || Array.from(key).length !== 1) {
    return ignored;
  }

  const query = previous + key.toLowerCase();
  const letters = Array.from(query);
  const first = letters[0]!;
  const repeated = letters.every((letter) => letter === first);
  const prefix = repeated ? first : query;
  const offset = repeated || activeIndex < 0 ? activeIndex + 1 : activeIndex;
  const search = [...navigable.slice(offset), ...navigable.slice(0, offset)];
  const match = search.find((item) => item.label.trimStart().toLowerCase().startsWith(prefix));
  return { handled: true, key: match?.key ?? activeKey, buffer: { query, time: now } };
}

export function recoverRovingKey(
  items: readonly CollectionItem[],
  previous: readonly CollectionItem[],
  missingKey: string,
  recoveryKey?: string | null,
): string | null {
  const recovery = findNavigable(items, recoveryKey);
  if (recovery) {
    return recovery.key;
  }
  const index = Math.max(
    0,
    previous.findIndex((item) => item.key === missingKey),
  );
  return (
    items.slice(index).find(isNavigable)?.key ??
    items.slice(0, index).findLast(isNavigable)?.key ??
    null
  );
}

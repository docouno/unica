export interface CollectionItem {
  readonly key: string;
  readonly label: string;
  readonly navigable?: boolean | undefined;
}

export interface NavigationOptions {
  readonly items: readonly CollectionItem[];
  readonly activeKey: string | null;
  readonly entryKey?: string | null | undefined;
  readonly orientation: 'horizontal' | 'vertical' | 'both';
  readonly direction: 'ltr' | 'rtl';
  readonly wrap: boolean;
  readonly typeahead: boolean;
  readonly homeEnd?: boolean | undefined;
}

export interface TypeaheadBuffer {
  readonly query: string;
  readonly time: number;
  readonly first?: string | undefined;
  readonly repeated?: boolean | undefined;
}

export interface NavigationResult {
  readonly handled: boolean;
  readonly key: string | null;
  readonly buffer: TypeaheadBuffer | null;
}

export type NavigationKey = Pick<
  KeyboardEvent,
  'key' | 'defaultPrevented' | 'altKey' | 'ctrlKey' | 'metaKey' | 'isComposing'
> & {
  readonly shiftKey?: boolean | undefined;
  readonly keyCode?: number | undefined;
};

const modifierOnlyKeys = /* @__PURE__ */ new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'AltGraph',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Dead',
]);

export function isNavigable(item: CollectionItem): boolean {
  return item.navigable !== false;
}

export function findNavigable<T extends CollectionItem>(
  items: readonly T[],
  key: string | null | undefined,
): T | undefined {
  if (key === null || key === undefined) {
    return undefined;
  }
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (item.key === key && isNavigable(item)) {
      return item;
    }
  }
  return undefined;
}

function findFirstNavigableIndex(items: readonly CollectionItem[]): number {
  for (let index = 0; index < items.length; index++) {
    if (isNavigable(items[index]!)) {
      return index;
    }
  }
  return -1;
}

function findLastNavigableIndex(items: readonly CollectionItem[]): number {
  for (let index = items.length - 1; index >= 0; index--) {
    if (isNavigable(items[index]!)) {
      return index;
    }
  }
  return -1;
}

function findNavigableIndexByKey(
  items: readonly CollectionItem[],
  key: string | null | undefined,
): number {
  if (key === null || key === undefined) {
    return -1;
  }
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (item.key === key && isNavigable(item)) {
      return index;
    }
  }
  return -1;
}

function stepNavigableIndex(
  items: readonly CollectionItem[],
  fromIndex: number,
  step: number,
  wrap: boolean,
): number {
  const length = items.length;
  for (let offset = 1; offset <= length; offset++) {
    const raw = fromIndex + step * offset;
    if (!wrap && (raw < 0 || raw >= length)) {
      return fromIndex;
    }
    const index = ((raw % length) + length) % length;
    if (isNavigable(items[index]!)) {
      return index;
    }
  }
  return fromIndex;
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
  const {
    activeKey,
    direction,
    entryKey,
    homeEnd = true,
    items,
    orientation,
    typeahead,
    wrap,
  } = options;
  const preserveBuffer = { handled: false, key: activeKey, buffer };
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.isComposing ||
    event.key === 'Process' ||
    event.keyCode === 229
  ) {
    return preserveBuffer;
  }

  const { key, shiftKey = false } = event;
  const isHomeEnd = homeEnd && !shiftKey && (key === 'Home' || key === 'End');
  const step = shiftKey ? 0 : arrowStep(key, orientation, direction);

  if (isHomeEnd) {
    const targetIndex =
      key === 'Home' ? findFirstNavigableIndex(items) : findLastNavigableIndex(items);
    if (targetIndex < 0) {
      return { handled: false, key: null, buffer: null };
    }
    return { handled: true, key: items[targetIndex]!.key, buffer: null };
  }

  if (step !== 0) {
    const firstIndex = findFirstNavigableIndex(items);
    if (firstIndex < 0) {
      return { handled: false, key: null, buffer: null };
    }
    const activeIndex = findNavigableIndexByKey(items, activeKey);
    if (activeIndex < 0) {
      const entryIndex = findNavigableIndexByKey(items, entryKey);
      const targetIndex =
        entryIndex >= 0 ? entryIndex : step > 0 ? firstIndex : findLastNavigableIndex(items);
      return { handled: true, key: items[targetIndex]!.key, buffer: null };
    }
    const nextIndex = stepNavigableIndex(items, activeIndex, step, wrap);
    return { handled: true, key: items[nextIndex]!.key, buffer: null };
  }

  if (modifierOnlyKeys.has(key)) {
    return preserveBuffer;
  }

  const activeBuffer = buffer && now >= buffer.time && now - buffer.time < 600 ? buffer : null;
  const previous = activeBuffer ? activeBuffer.query : '';
  const isSpace = key === ' ';

  if (!typeahead || (isSpace && previous === '') || Array.from(key).length !== 1) {
    // Non-modifier keys like Enter, leading Space, or Tab finish any active typeahead query.
    return { handled: false, key: activeKey, buffer: null };
  }

  if (findFirstNavigableIndex(items) < 0) {
    return { handled: false, key: null, buffer: null };
  }

  const char = key.normalize('NFC').toLowerCase();
  const query = previous + char;
  const first = activeBuffer ? (activeBuffer.first ?? Array.from(previous)[0] ?? char) : char;
  const repeated = activeBuffer
    ? (activeBuffer.repeated ?? Array.from(previous).every((letter) => letter === first)) &&
      char === first
    : true;
  const prefix = repeated ? first : query;
  const activeIndex = findNavigableIndexByKey(items, activeKey);
  const start = repeated || activeIndex < 0 ? activeIndex + 1 : activeIndex;
  const length = items.length;

  let matchedKey: string | null = null;
  for (let offset = 0; offset < length; offset++) {
    const item = items[(start + offset) % length]!;
    if (
      isNavigable(item) &&
      item.label.trimStart().normalize('NFC').toLowerCase().startsWith(prefix)
    ) {
      matchedKey = item.key;
      break;
    }
  }

  const fallbackKey = activeIndex >= 0 ? items[activeIndex]!.key : null;
  return {
    handled: true,
    key: matchedKey ?? fallbackKey,
    buffer: { query, time: now, first, repeated },
  };
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

  const navigableKeys = new Set<string>();
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (isNavigable(item)) {
      navigableKeys.add(item.key);
    }
  }
  if (navigableKeys.size === 0) {
    return null;
  }

  const prevIndex = previous.findIndex((item) => item.key === missingKey);
  if (prevIndex >= 0) {
    for (let index = prevIndex + 1; index < previous.length; index++) {
      const candidate = previous[index]!.key;
      if (navigableKeys.has(candidate)) {
        return candidate;
      }
    }
    for (let index = prevIndex - 1; index >= 0; index--) {
      const candidate = previous[index]!.key;
      if (navigableKeys.has(candidate)) {
        return candidate;
      }
    }
  }

  const clamped = Math.max(0, Math.min(prevIndex < 0 ? 0 : prevIndex, items.length));
  for (let index = clamped; index < items.length; index++) {
    if (isNavigable(items[index]!)) {
      return items[index]!.key;
    }
  }
  for (let index = clamped - 1; index >= 0; index--) {
    if (isNavigable(items[index]!)) {
      return items[index]!.key;
    }
  }
  return null;
}

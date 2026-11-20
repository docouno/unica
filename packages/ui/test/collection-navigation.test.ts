import { describe, expect, it } from 'vitest';
import { navigateCollection, recoverRovingKey } from '../src/core/collections/navigation.js';
import type { NavigationOptions, TypeaheadBuffer } from '../src/core/collections/navigation.js';

const items = [
  { key: 'a', label: 'Beta' },
  { key: 'b', label: 'Bravo' },
  { key: 'c', label: 'Blue', navigable: false },
  { key: 'd', label: 'Cedar' },
];
const defaults: NavigationOptions = {
  items,
  activeKey: 'a',
  direction: 'ltr',
  orientation: 'both',
  wrap: false,
  typeahead: true,
};

function press(
  key: string,
  options: Partial<NavigationOptions> = {},
  buffer: TypeaheadBuffer | null = null,
  now = 0,
  event: KeyboardEventInit & { keyCode?: number } = {},
): ReturnType<typeof navigateCollection> {
  const keyboardEvent = new KeyboardEvent('keydown', { key, ...event });
  if (event.keyCode !== undefined) {
    Object.defineProperty(keyboardEvent, 'keyCode', { value: event.keyCode });
  }
  return navigateCollection(keyboardEvent, { ...defaults, ...options }, buffer, now);
}

describe('collection navigation', () => {
  it('shares axis, edge, and disabled policies across both directions', () => {
    expect(press('ArrowRight').key).toBe('b');
    expect(press('ArrowLeft', { direction: 'rtl' }).key).toBe('b');
    expect(press('ArrowDown', { direction: 'rtl', activeKey: 'b' }).key).toBe('d');
    expect(press('ArrowRight', { orientation: 'vertical' }).handled).toBe(false);
    expect(press('ArrowUp', { orientation: 'horizontal' }).handled).toBe(false);
    expect(press('ArrowUp').key).toBe('a');
    expect(press('ArrowUp', { wrap: true }).key).toBe('d');
    expect(press('End', { direction: 'rtl' }).key).toBe('d');
    expect(press('Home', { direction: 'rtl', activeKey: 'd' }).key).toBe('a');
    expect(press('Home', { homeEnd: false }).handled).toBe(false);
    expect(press('End', { homeEnd: false }).handled).toBe(false);
  });

  it('supports an empty active key and an optional entry target', () => {
    expect(press('ArrowDown', { activeKey: null }).key).toBe('a');
    expect(press('ArrowUp', { activeKey: null }).key).toBe('d');
    expect(press('ArrowUp', { activeKey: null, entryKey: 'b' }).key).toBe('b');
    expect(press('ArrowDown', { activeKey: null, entryKey: 'c' }).key).toBe('a');
    expect(press('ArrowDown', { items: [] })).toEqual({ handled: false, key: null, buffer: null });
    const disabled = items.map((item) => ({ ...item, navigable: false }));
    expect(press('End', { items: disabled })).toEqual({ handled: false, key: null, buffer: null });
  });

  it('cycles repeated keys, refines prefixes, handles spaces mid-query, and expires at 600 ms', () => {
    const beta = press('b', { activeKey: 'd' }, null, 10);
    expect(beta.key).toBe('a');
    const bravo = press('B', { activeKey: beta.key }, beta.buffer, 40);
    expect(bravo.key).toBe('b');
    const cycle = press('b', { activeKey: bravo.key }, bravo.buffer, 55);
    expect(cycle.key).toBe('a');

    const prefix = press('b', { activeKey: 'a' }, cycle.buffer, 655);
    expect(prefix.key).toBe('b');
    expect(prefix.buffer?.query).toBe('b');
    const refined = press('R', { activeKey: prefix.key }, prefix.buffer, 1254);
    expect(refined.key).toBe('b');
    expect(refined.buffer?.query).toBe('br');
    expect(press('z', { activeKey: refined.key }, refined.buffer, 1255).key).toBe('b');
    expect(press('c', { activeKey: refined.key }, refined.buffer, 1854).key).toBe('d');
    expect(press('c', { activeKey: refined.key }).key).toBe('d');

    // Negative time deltas (for example clock origin change) start a fresh search.
    const negativeDelta = press('c', { activeKey: 'a' }, { query: 'b', time: 1000 }, 500);
    expect(negativeDelta.key).toBe('d');
    expect(negativeDelta.buffer?.query).toBe('c');

    // Multi-word typeahead includes Space when a query is active, while leading Space stays unhandled.
    const multiWord = [
      { key: 'doc', label: 'New Document' },
      { key: 'file', label: 'New File' },
    ];
    expect(press(' ', { items: multiWord, activeKey: 'doc' }, null, 0).handled).toBe(false);
    let state = press('n', { items: multiWord, activeKey: null }, null, 10);
    state = press('e', { items: multiWord, activeKey: state.key }, state.buffer, 20);
    state = press('w', { items: multiWord, activeKey: state.key }, state.buffer, 30);
    state = press(' ', { items: multiWord, activeKey: state.key }, state.buffer, 40);
    expect(state.handled).toBe(true);
    state = press('f', { items: multiWord, activeKey: state.key }, state.buffer, 50);
    expect(state.key).toBe('file');
  });

  it('normalizes Unicode NFC/NFD labels and handles multi-codepoint lowercase expansion', () => {
    const unicodeItems = [
      { key: 'nfd', label: 'e\u0301clair' },
      { key: 'i1', label: 'İzmir' },
      { key: 'i2', label: 'İstanbul' },
    ];
    expect(press('é', { items: unicodeItems, activeKey: null }, null, 10).key).toBe('nfd');
    const first = press('İ', { items: unicodeItems, activeKey: null }, null, 20);
    expect(first.key).toBe('i1');
    const second = press('İ', { items: unicodeItems, activeKey: first.key }, first.buffer, 40);
    expect(second.key).toBe('i2');
  });

  it('leaves activation, text editing, Shift+navigation, command keys, and IME to the family', () => {
    expect(press('b', {}, null, 0, { isComposing: true }).handled).toBe(false);
    expect(press('b', {}, null, 0, { keyCode: 229 }).handled).toBe(false);
    expect(press('Process', {}, null, 0).handled).toBe(false);
    expect(press('b', {}, null, 0, { ctrlKey: true }).handled).toBe(false);
    expect(press('ArrowDown', {}, null, 0, { altKey: true }).handled).toBe(false);
    expect(press('ArrowDown', {}, null, 0, { shiftKey: true }).handled).toBe(false);
    expect(press('Home', {}, null, 0, { shiftKey: true }).handled).toBe(false);
    expect(press('End', {}, null, 0, { shiftKey: true }).handled).toBe(false);
    expect(press('b', { typeahead: false }).handled).toBe(false);

    // Non-modifier keys like Enter clear active typeahead; Shift preserves it for uppercase input.
    const activeBuffer = { query: 'b', time: 0 };
    expect(press('Shift', {}, activeBuffer, 10)).toEqual({
      handled: false,
      key: 'a',
      buffer: activeBuffer,
    });
    expect(press('Enter', {}, activeBuffer, 10)).toEqual({
      handled: false,
      key: 'a',
      buffer: null,
    });
    expect(press(' ', {}, null, 10).handled).toBe(false);

    // Unmatched typeahead never echoes a stale or non-navigable activeKey.
    expect(press('z', { activeKey: 'c' }, null, 10).key).toBeNull();

    const prevented = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    prevented.preventDefault();
    expect(navigateCollection(prevented, defaults, null, 0).handled).toBe(false);
  });

  it('validates family recovery and falls back to the nearest surviving neighbor', () => {
    const remaining = [items[0]!, items[2]!, items[3]!];
    expect(recoverRovingKey(remaining, items, 'b', 'a')).toBe('a');
    expect(recoverRovingKey(remaining, items, 'b', 'c')).toBe('d');
    expect(recoverRovingKey(remaining, items, 'b', 'missing')).toBe('d');
    expect(recoverRovingKey(remaining.slice(0, -1), items, 'd')).toBe('a');
    expect(recoverRovingKey([], items, 'b', 'a')).toBeNull();

    // Simultaneous removal of elements before and including missingKey keeps the immediate neighbor.
    const list = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
      { key: 'd', label: 'D' },
    ];
    expect(recoverRovingKey([list[2]!, list[3]!], list, 'b')).toBe('c');
  });
});

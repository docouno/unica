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
  event: KeyboardEventInit = {},
): ReturnType<typeof navigateCollection> {
  return navigateCollection(
    new KeyboardEvent('keydown', { key, ...event }),
    { ...defaults, ...options },
    buffer,
    now,
  );
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

  it('cycles repeated keys, refines prefixes, and expires at 600 ms', () => {
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
  });

  it('leaves activation, text editing, command keys, and IME to the family', () => {
    const composing = press('b', {}, null, 0, { isComposing: true });
    expect(composing.handled).toBe(false);
    expect(press('b', {}, null, 0, { ctrlKey: true }).handled).toBe(false);
    expect(press('ArrowDown', {}, null, 0, { altKey: true }).handled).toBe(false);
    expect(press('b', { typeahead: false }).handled).toBe(false);
    expect(press('Enter').handled).toBe(false);
    expect(press(' ', {}, { query: 'b', time: 0 }, 10).handled).toBe(false);
    const prevented = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    prevented.preventDefault();
    expect(navigateCollection(prevented, defaults, null, 0).handled).toBe(false);
  });

  it('validates family recovery and falls back around the previous position', () => {
    const remaining = [items[0]!, items[2]!, items[3]!];
    expect(recoverRovingKey(remaining, items, 'b', 'a')).toBe('a');
    expect(recoverRovingKey(remaining, items, 'b', 'c')).toBe('d');
    expect(recoverRovingKey(remaining, items, 'b', 'missing')).toBe('d');
    expect(recoverRovingKey(remaining.slice(0, -1), items, 'd')).toBe('a');
    expect(recoverRovingKey([], items, 'b', 'a')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  createScale,
  moveThumb,
  normalizeValues,
  serializeValue,
  sortMarks,
  thumbBounds,
} from '../src/components/Slider/scale.js';

describe('slider grid', () => {
  it('rounds halfway toward the higher number and uses the last reachable point', () => {
    const scale = createScale(0, 1, 0.3, 0);
    expect(scale.maximum).toBe(0.9);
    expect(scale.indexOf(0.45)).toBe(2);
    expect(scale.valueAt(2)).toBe(0.6);
    expect(scale.fractionOf(0.45)).toBe(0.5);
    expect(scale.indexAtFraction(0.5)).toBe(2);
    expect(scale.indexAtFraction(0.49999999999999994)).toBe(1);
  });

  it('crosses zero and distinguishes adjacent small decimal points', () => {
    const signed = createScale(-0.3, 0.3, 0.1, 0);
    expect([1, 2, 3].map((i) => signed.valueAt(i))).toEqual([-0.2, -0.1, 0]);
    expect(normalizeValues(signed, [-0.15])).toEqual([-0.1]);
    expect(serializeValue(-0)).toBe('0');
    const tiny = createScale(0, 1e-8, 1e-9, 0);
    expect([tiny.valueAt(3), tiny.valueAt(4)]).toEqual([3e-9, 4e-9]);
  });

  it('supports huge spans and counts without walking the grid', () => {
    expect(createScale(0, 1, 1e-15, 0).count).toBe(10 ** 15);
    const scale = createScale(-1e15, 1e15, 1, 0);
    expect(scale.count).toBe(2e15);
    expect(scale.valueAt(scale.indexOf(999999999999999))).toBe(999999999999999);
    const extreme = createScale(-1.7e308, 1.7e308, 1.7e308, 0);
    expect(extreme.fractionOf(0)).toBe(0.5);
    expect(extreme.fractionOf(8.5e307)).toBe(0.75);
    expect(createScale(1e300, 1e300, 1e-290, 0).maximum).toBe(1e300);
  });

  it('keeps the other thumb stationary during a move and projects pairs lower first', () => {
    const scale = createScale(0, 100, 5, 2);
    expect(thumbBounds(scale, [40, 50], 0)).toEqual([0, 8]);
    expect(thumbBounds(scale, [40, 50], 1)).toEqual([10, 20]);
    expect(moveThumb(scale, [40, 50], 0, 20)).toEqual([40, 50]);
    expect(moveThumb(scale, [40, 50], 0, 7)).toEqual([35, 50]);
    expect(normalizeValues(createScale(0, 20, 1, 5), [10, 12])).toEqual([10, 15]);
    expect(normalizeValues(createScale(0, 12, 1, 5), [10, 15])).toEqual([7, 12]);
    expect(normalizeValues(createScale(4, 4, 1, 0), [2, 6])).toEqual([4, 4]);
  });

  it('sorts a copy of unsnapped marks and rejects unreachable values', () => {
    const scale = createScale(0, 1, 0.3, 0);
    const authored = [{ value: 0.9 }, { value: 0.45, label: 'Half' }, { value: 0 }];
    expect(sortMarks(scale, authored).map((mark) => mark.value)).toEqual([0, 0.45, 0.9]);
    expect(authored[0]?.value).toBe(0.9);
    expect(() => sortMarks(scale, [{ value: 1 }])).toThrow(RangeError);
  });
});

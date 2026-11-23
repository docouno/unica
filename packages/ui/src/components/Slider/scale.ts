import type { SliderMark } from './types.js';

interface Decimal {
  readonly coefficient: bigint;
  readonly exponent: number;
}

const minimumNormal = 2.2250738585072014e-308;
const coefficientLimit = 10n ** 15n;

function power(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

export function serializeValue(value: number): string {
  return String(value);
}

function decimal(value: number): Decimal {
  const [significand = '0', magnitude = '0'] = serializeValue(value).split('e');
  const [whole = '0', fraction = ''] = significand.split('.');
  const digits = whole + fraction;
  const coefficient = digits.replace(/0+$/, '');
  return coefficient
    ? {
        coefficient: BigInt(coefficient),
        exponent: Number(magnitude) - fraction.length + digits.length - coefficient.length,
      }
    : { coefficient: 0n, exponent: 0 };
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function units(value: Decimal, exponent: number): bigint {
  return value.coefficient === 0n ? 0n : value.coefficient * power(value.exponent - exponent);
}

function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  return value % divisor < 0n ? quotient - 1n : quotient;
}

function normalOrZero(value: number): boolean {
  return Number.isFinite(value) && (value === 0 || Math.abs(value) >= minimumNormal);
}

function nativeDecimal(value: number): Decimal {
  if (!normalOrZero(value)) {
    throw new RangeError('Slider bounds and step must be finite normal numbers or zero.');
  }
  const result = decimal(value);
  if (absolute(result.coefficient) >= coefficientLimit) {
    throw new RangeError('Slider bounds and step support up to 15 significant decimal digits.');
  }
  return result;
}

function inFixedNotationBand(value: Decimal): boolean {
  const magnitude = absolute(value.coefficient);
  return magnitude >= power(-6 - value.exponent) && magnitude < power(-value.exponent);
}

function verifyNativePrecision(
  start: bigint,
  step: bigint,
  lastIndex: bigint,
  exponent: number,
): void {
  if (exponent >= -18) {
    return;
  }
  const lower = power(-6 - exponent);
  const upper = power(-exponent) - 1n;
  const quantum = power(-18 - exponent);
  const bands = [
    [lower, upper],
    [-upper, -lower],
  ] as const;
  for (const [min, max] of bands) {
    const first = -floorDivide(start - min, step);
    const last = floorDivide(max - start, step);
    const from = first < 0n ? 0n : first;
    const to = last > lastIndex ? lastIndex : last;
    if (
      from <= to &&
      ((start + from * step) % quantum !== 0n || (from < to && step % quantum !== 0n))
    ) {
      throw new RangeError(
        'Slider points from 0.000001 up to 1 in magnitude must be multiples of 1e-18.',
      );
    }
  }
}

export interface SliderScale {
  readonly min: number;
  readonly maximum: number;
  readonly step: number;
  readonly count: number;
  readonly gap: number;
  readonly valueAt: (index: number) => number;
  readonly indexOf: (value: number) => number;
  readonly indexAtFraction: (fraction: number) => number;
  readonly fractionOf: (value: number) => number;
}

export function createScale(min: number, max: number, step: number, gap: number): SliderScale {
  const start = nativeDecimal(min);
  const end = nativeDecimal(max);
  const stride = nativeDecimal(step);
  if (min > max || step <= 0) {
    throw new RangeError('Slider requires min <= max and a positive step.');
  }
  if (stride.exponent < -18 && inFixedNotationBand(stride)) {
    throw new RangeError('Slider step from 0.000001 up to 1 must be a multiple of 1e-18.');
  }
  const exponent =
    start.coefficient === 0n ? stride.exponent : Math.min(start.exponent, stride.exponent);
  const first = units(start, exponent);
  const spacing = units(stride, exponent);
  const endExponent = end.coefficient === 0n ? exponent : Math.min(end.exponent, exponent);
  const factor = power(exponent - endExponent);
  const last = (units(end, endExponent) - first * factor) / (spacing * factor);
  const distance = last * spacing;
  if (
    last > 0n &&
    (absolute(first) > coefficientLimit || absolute(first + distance) > coefficientLimit)
  ) {
    throw new RangeError(
      'Slider endpoints exceed the 10^15 coefficient limit at the grid precision.',
    );
  }
  verifyNativePrecision(first, spacing, last, exponent);

  function point(index: bigint): number {
    return Number(`${first + index * spacing}e${exponent}`);
  }
  const belowZero = floorDivide(-first, spacing);
  for (const index of [belowZero - 1n, belowZero, belowZero + 1n]) {
    if (index >= 0n && index <= last && !normalOrZero(point(index))) {
      throw new RangeError('Slider scale contains a subnormal point.');
    }
  }

  const count = Number(last);
  if (!Number.isSafeInteger(gap) || gap < 0 || gap > count) {
    throw new RangeError(
      'RangeSlider minStepsBetweenThumbs must be a nonnegative integer within the grid.',
    );
  }
  const minimum = point(0n);
  const maximum = point(last);

  function offsetOf(value: number): readonly [bigint, bigint] {
    const input = decimal(value);
    const common = input.coefficient === 0n ? exponent : Math.min(input.exponent, exponent);
    const scale = power(exponent - common);
    return [units(input, common) - first * scale, scale];
  }

  function nearest(distance: bigint, stride: bigint): number {
    return Number((2n * distance + stride) / (2n * stride));
  }

  return {
    min: minimum,
    maximum,
    step,
    count,
    gap,
    valueAt: (index) => point(BigInt(index)),
    indexOf(value) {
      if (!Number.isFinite(value)) {
        throw new RangeError('Slider values must be finite numbers.');
      }
      if (value <= minimum) {
        return 0;
      }
      if (value >= maximum) {
        return count;
      }
      const [offset, scale] = offsetOf(value);
      return nearest(offset, spacing * scale);
    },
    indexAtFraction(fraction) {
      if (fraction <= 0) {
        return 0;
      }
      if (fraction >= 1) {
        return count;
      }
      const { coefficient, exponent } = decimal(fraction);
      return nearest(coefficient * last, power(-exponent));
    },
    fractionOf(value) {
      if (count === 0 || value === minimum) {
        return 0;
      }
      if (value === maximum) {
        return 1;
      }
      const [offset, scale] = offsetOf(value);
      const denominator = distance * scale;
      // Keep small fractions representable even when the common decimal scale is enormous.
      const places = Math.max(18, String(denominator).length - String(offset).length + 18);
      return Number(`${(offset * power(places)) / denominator}e-${places}`);
    },
  };
}

export type SliderValues = readonly [number] | readonly [number, number];

export function equalValues(left: SliderValues, right: SliderValues): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

export function normalizeValues(scale: SliderScale, values: SliderValues): SliderValues {
  const [lower, upper] = values;
  const index = scale.indexOf(lower);
  if (values.length === 1) {
    return [scale.valueAt(index)];
  }
  if (values.length !== 2 || upper === undefined || lower > upper) {
    throw new RangeError('RangeSlider values must be an ordered pair of finite numbers.');
  }
  const minimum = Math.min(index, scale.count - scale.gap);
  const maximum = Math.max(minimum + scale.gap, scale.indexOf(upper));
  return [scale.valueAt(minimum), scale.valueAt(maximum)];
}

export function thumbBounds(
  scale: SliderScale,
  values: SliderValues,
  thumb: 0 | 1,
): readonly [number, number] {
  if (values[1] === undefined) {
    return [0, scale.count];
  }
  return thumb === 0
    ? [0, scale.indexOf(values[1]) - scale.gap]
    : [scale.indexOf(values[0]) + scale.gap, scale.count];
}

export function moveThumb(
  scale: SliderScale,
  values: SliderValues,
  thumb: 0 | 1,
  index: number,
): SliderValues {
  const [min, max] = thumbBounds(scale, values, thumb);
  const value = scale.valueAt(Math.min(max, Math.max(min, index)));
  if (values[1] === undefined) {
    return [value];
  }
  return thumb === 0 ? [value, values[1]] : [values[0], value];
}

export function sortMarks(scale: SliderScale, marks: readonly SliderMark[]): SliderMark[] {
  const sorted = [...marks].sort((left, right) => left.value - right.value);
  for (const [index, mark] of sorted.entries()) {
    if (
      !Number.isFinite(mark.value) ||
      mark.value < scale.min ||
      mark.value > scale.maximum ||
      mark.value === sorted[index - 1]?.value
    ) {
      throw new RangeError(
        'Slider marks must have unique finite values within the reachable scale.',
      );
    }
  }
  return sorted;
}

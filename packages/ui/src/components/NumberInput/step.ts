import { decimal, floorDivide, units } from '../../core/decimal.js';

export type Direction = -1 | 1;

export interface StepDomain {
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly step: number | 'any';
  readonly base: number;
}

export function finite(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value + 0 : undefined;
}

export function stepSize(value: number | 'any' | undefined): number | 'any' {
  return value === 'any' || (value !== undefined && Number.isFinite(value) && value > 0)
    ? value
    : 1;
}

export function numberValue(input: HTMLInputElement): number | '' | undefined {
  if (input.validity.badInput) {
    return undefined;
  }
  return input.value === '' ? '' : finite(input.valueAsNumber);
}

function numericAttribute(value: string | null): number | undefined {
  return value?.trim() ? finite(Number(value)) : undefined;
}

export function readStepDomain(input: HTMLInputElement): StepDomain {
  const min = numericAttribute(input.getAttribute('min'));
  const step = input.getAttribute('step');
  return {
    min,
    max: numericAttribute(input.getAttribute('max')),
    step: stepSize(step === 'any' ? 'any' : numericAttribute(step)),
    base: min ?? numericAttribute(input.getAttribute('value')) ?? 0,
  };
}

/** The first reachable point in the requested direction, in exact decimal arithmetic. */
export function stepCandidate(
  current: number | '',
  { min, max, step, base }: StepDomain,
  direction: Direction,
): number | undefined {
  if (min !== undefined && max !== undefined && min > max) {
    return undefined;
  }

  const value = decimal(current === '' ? 0 : current);
  const origin = decimal(step === 'any' ? 0 : base);
  const stride = decimal(step === 'any' ? 1 : step);
  const minimum = min === undefined ? undefined : decimal(min);
  const maximum = max === undefined ? undefined : decimal(max);
  const exponent = [value, origin, minimum, maximum].reduce(
    (common, part) => (part && part.coefficient !== 0n ? Math.min(common, part.exponent) : common),
    stride.exponent,
  );
  const position = units(value, exponent);
  const first = units(origin, exponent);
  const distance = units(stride, exponent);
  const lower = minimum && units(minimum, exponent);
  const upper = maximum && units(maximum, exponent);

  let next: bigint;
  if (step === 'any') {
    next = position + BigInt(direction) * distance;
    if (lower !== undefined && (position < lower || next < lower)) {
      next = lower;
    }
    if (upper !== undefined && (position > upper || next > upper)) {
      next = upper;
    }
  } else {
    const offset = position - first;
    // BigInt division truncates toward zero. Floor and ceiling distinguish
    // the two neighbors even when the value is negative or between grid points.
    const floor = floorDivide(offset, distance);
    const ceil = -floorDivide(-offset, distance);
    const index = direction === 1 ? floor + 1n : ceil - 1n;
    next = first + index * distance;
    if (lower !== undefined && (position < lower || next < lower)) {
      next = first - floorDivide(first - lower, distance) * distance;
    }
    if (upper !== undefined && (position > upper || next > upper)) {
      next = first + floorDivide(upper - first, distance) * distance;
    }
  }

  if (
    (lower !== undefined && next < lower) ||
    (upper !== undefined && next > upper) ||
    (current !== '' && (direction === 1 ? next <= position : next >= position))
  ) {
    return undefined;
  }
  const candidate = Number(`${next}e${exponent}`);
  if (!Number.isFinite(candidate)) {
    return undefined;
  }
  const roundTrip = decimal(candidate);
  const commonExponent = Math.min(exponent, roundTrip.exponent);
  return units(roundTrip, commonExponent) === units({ coefficient: next, exponent }, commonExponent)
    ? candidate
    : undefined;
}

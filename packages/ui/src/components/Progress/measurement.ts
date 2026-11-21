export interface Measurement {
  readonly value: number;
  readonly max: number;
  readonly fraction: number;
}

export function measure(value: number | null, max: number): Measurement | undefined {
  if (value === null || !Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return undefined;
  }

  const clamped = Math.min(max, Math.max(0, value));
  return { value: clamped, max, fraction: clamped / max };
}

export function percentLabel({ value, max, fraction }: Measurement): string {
  if (value === max) {
    return '100%';
  }

  const percent = fraction * 100;
  // Multiplication can land just below an integer, for example 29 / 100 * 100.
  return `${Math.min(99, Math.floor(percent + percent * Number.EPSILON))}%`;
}

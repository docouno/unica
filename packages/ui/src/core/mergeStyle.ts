import type { CSSProperties } from 'react';

export type StyleWithVars = CSSProperties & {
  readonly [name: `--${string}`]: string | number | undefined;
};

function assignDefined(target: Record<string, unknown>, source: StyleWithVars | undefined): void {
  if (!source) {
    return;
  }
  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value !== undefined) {
      target[key] = value;
    }
  }
}

/** Merge inline styles with priority `defaults < consumer < owned`. */
export function mergeStyle(
  consumer?: StyleWithVars,
  owned?: StyleWithVars,
  defaults?: StyleWithVars,
): StyleWithVars | undefined {
  if (!defaults && !consumer && !owned) {
    return undefined;
  }
  const merged: Record<string, unknown> = {};
  assignDefined(merged, defaults);
  assignDefined(merged, consumer);
  if (owned) {
    const ownedRecord = owned as Record<string, unknown>;
    for (const key of Object.keys(ownedRecord)) {
      const value = ownedRecord[key];
      if (value === undefined) {
        Reflect.deleteProperty(merged, key);
      } else {
        merged[key] = value;
      }
    }
  }
  return Object.keys(merged).length > 0 ? (merged as StyleWithVars) : undefined;
}

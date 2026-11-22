import type { CSSProperties } from 'react';
import type { BREAKPOINT } from '../../consts.js';
import type { Spacing } from '../../types.js';
import type { Responsive } from './types.js';

export type { Responsive, Spacing };

export type Breakpoint = (typeof BREAKPOINT)[keyof typeof BREAKPOINT];
export const breakpoints: readonly Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
type ResponsiveValue = string | number;

export type LayoutStyle = CSSProperties & Record<`--_${string}`, ResponsiveValue>;

export function breakpointValue<T extends ResponsiveValue>(
  value: Responsive<T> | undefined,
  breakpoint: Breakpoint,
): T | undefined {
  if (typeof value === 'object') {
    return value[breakpoint];
  }
  return breakpoint === 'mobile' ? value : undefined;
}

export function setResponsive<T extends ResponsiveValue>(
  style: LayoutStyle,
  name: string,
  value: Responsive<T> | undefined,
  serialize?: (value: T) => ResponsiveValue,
): void {
  if (value === undefined) {
    return;
  }
  for (const breakpoint of breakpoints) {
    const entry = breakpointValue(value, breakpoint);
    if (entry !== undefined) {
      style[`--_${name}-${breakpoint}`] = serialize ? serialize(entry) : entry;
    }
  }
}

export function space(value: Spacing): string {
  return `var(--space-${value})`;
}

export function flexAlignment(value: string): string {
  return value === 'start' || value === 'end' ? `flex-${value}` : value;
}

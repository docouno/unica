import type { CSSProperties } from 'react';

export type Responsive<T> =
  | T
  | {
      readonly mobile?: T | undefined;
      readonly tablet?: T | undefined;
      readonly desktop?: T | undefined;
      readonly wide?: T | undefined;
    };

export type Spacing = 0 | 'xs' | 's' | 'm' | 'l' | 'xl';

export const breakpoints = ['mobile', 'tablet', 'desktop', 'wide'] as const;
type Breakpoint = (typeof breakpoints)[number];
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

export function layoutClass(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}
